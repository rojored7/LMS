"""
Incident Service
Processes GlitchTip webhooks, enriches with context, generates diagnostic reports.
"""

import json
import os
from datetime import datetime, timezone

import httpx
import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.gamification import Notification, NotificationType
from app.models.progress import Enrollment
from app.models.user import User, UserRole
from app.schemas.incident import IncidentReport

logger = structlog.get_logger()
settings = get_settings()

# Counter for incident IDs (resets on restart, but IDs include timestamp so still unique)
_incident_counter = 0


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_webhook(self, payload: dict) -> IncidentReport:
        global _incident_counter
        _incident_counter += 1
        now = datetime.now(timezone.utc)
        incident_id = f"INC-{now.strftime('%Y%m%d')}-{_incident_counter:04d}"

        title = payload.get("title", "Unknown error")
        level = payload.get("level", "error")
        issue_url = payload.get("url", "")

        # 1. Fetch full event from GlitchTip API
        event_data = await self._fetch_event(payload)

        # 2. Extract user and request_id
        user_info = event_data.get("user") if event_data else None
        raw_tags = event_data.get("tags", {}) if event_data else {}
        # GlitchTip API returns tags as list of {key, value}, normalize to dict
        if isinstance(raw_tags, list):
            tags = {t["key"]: t["value"] for t in raw_tags if "key" in t}
        else:
            tags = raw_tags
        request_id = tags.get("request_id", "")
        contexts = event_data.get("contexts", {}) if event_data else {}

        # 3. Search backend logs by request_id
        backend_logs = self._search_logs(request_id) if request_id else []

        # 4. Fetch user context from DB
        user_context = None
        if user_info and user_info.get("id"):
            user_context = await self._fetch_user_context(user_info["id"])

        # 5. Extract breadcrumbs
        breadcrumbs = []
        if event_data and event_data.get("breadcrumbs"):
            raw = event_data["breadcrumbs"]
            values = raw.get("values", raw) if isinstance(raw, dict) else raw
            for b in (values if isinstance(values, list) else []):
                breadcrumbs.append({
                    "time": b.get("timestamp", ""),
                    "type": b.get("category", b.get("type", "")),
                    "message": b.get("message", ""),
                    "data": b.get("data", {}),
                    "level": b.get("level", "info"),
                })

        # 6. Extract stack trace
        exception_data = {}
        if event_data:
            exc_values = event_data.get("exception", {}).get("values", [])
            if exc_values:
                last_exc = exc_values[-1]
                frames = last_exc.get("stacktrace", {}).get("frames", [])
                last_frame = frames[-1] if frames else {}
                exception_data = {
                    "type": last_exc.get("type", "Unknown"),
                    "message": last_exc.get("value", title),
                    "file": f"{last_frame.get('filename', '?')}:{last_frame.get('lineno', '?')}",
                    "function": last_frame.get("function", "?"),
                    "stack_trace": [
                        f"  {f.get('filename', '?')}:{f.get('lineno', '?')} in {f.get('function', '?')}"
                        for f in frames[-10:]
                    ],
                }
            else:
                exception_data = {"type": "Unknown", "message": title}

        # 7. Build request info
        request_info = contexts.get("request_info")
        if not request_info and event_data:
            req = event_data.get("request", {})
            if req:
                request_info = {
                    "method": req.get("method", "?"),
                    "path": req.get("url", "?"),
                    "query": req.get("query_string", ""),
                }

        # 8. Build report
        report = IncidentReport(
            incident_id=incident_id,
            severity=level,
            timestamp=now.isoformat(),
            error=exception_data,
            user=user_context or ({"id": user_info["id"], "email": user_info.get("email", "?")} if user_info else None),
            request=request_info,
            breadcrumbs=breadcrumbs,
            backend_logs=backend_logs,
            glitchtip_url=issue_url,
        )

        # 9. Save to disk
        await self._save_report(report)

        # 10. Create notification for admins
        if settings.INCIDENT_NOTIFY_ADMINS:
            await self._notify_admins(report)

        logger.warning("incident_created", incident_id=incident_id, title=title, severity=level)
        return report

    async def _fetch_event(self, payload: dict) -> dict | None:
        if not settings.GLITCHTIP_API_TOKEN or not settings.GLITCHTIP_INTERNAL_URL:
            return payload.get("event")

        try:
            # Extract issue ID from webhook payload
            issue_id = payload.get("id")
            if not issue_id:
                url = payload.get("url", "")
                parts = url.rstrip("/").split("/")
                issue_id = parts[-1] if parts else None

            if not issue_id:
                return payload.get("event")

            org_slug = payload.get("project_slug", "lms-platform")
            async with httpx.AsyncClient(timeout=10) as client:
                # Try to get latest event for this issue
                resp = await client.get(
                    f"{settings.GLITCHTIP_INTERNAL_URL}/api/0/issues/{issue_id}/events/latest/",
                    headers={"Authorization": f"Bearer {settings.GLITCHTIP_API_TOKEN}"},
                )
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning("glitchtip_api_error", error=str(e))

        return payload.get("event")

    def _search_logs(self, request_id: str) -> list[str]:
        log_dir = settings.LOG_DIR
        logs = []
        try:
            for filename in os.listdir(log_dir):
                if not filename.endswith(".log"):
                    continue
                filepath = os.path.join(log_dir, filename)
                with open(filepath, "r", errors="replace") as f:
                    for line in f:
                        if request_id in line:
                            logs.append(line.strip())
                            if len(logs) >= 50:
                                break
        except (FileNotFoundError, PermissionError):
            pass
        return logs

    async def _fetch_user_context(self, user_id: str) -> dict | None:
        try:
            result = await self.db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                return None

            enrollment_count = await self.db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.user_id == user_id)
            )
            count = enrollment_count.scalar() or 0

            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value if user.role else "UNKNOWN",
                "xp": user.xp or 0,
                "enrolled_courses": count,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "last_login": user.last_login_at.isoformat() if user.last_login_at else None,
            }
        except Exception as e:
            logger.warning("user_context_error", error=str(e), user_id=user_id)
            return {"id": user_id, "error": str(e)}

    async def _save_report(self, report: IncidentReport) -> None:
        incident_dir = settings.INCIDENT_STORAGE_DIR
        os.makedirs(incident_dir, exist_ok=True)
        filepath = os.path.join(incident_dir, f"{report.incident_id}.json")
        with open(filepath, "w") as f:
            json.dump(report.model_dump(), f, indent=2, default=str)
        logger.info("incident_saved", path=filepath)

    async def _notify_admins(self, report: IncidentReport) -> None:
        try:
            result = await self.db.execute(
                select(User).where(User.role == UserRole.ADMIN).limit(5)
            )
            admins = list(result.scalars().all())
            for admin in admins:
                notification = Notification(
                    user_id=admin.id,
                    title=f"Incidente: {report.error.get('type', 'Error')}",
                    message=f"{report.error.get('message', '')} - {report.incident_id}",
                    type=NotificationType.INCIDENT,
                    data={"incident_id": report.incident_id, "severity": report.severity, "glitchtip_url": report.glitchtip_url},
                )
                self.db.add(notification)
            await self.db.flush()
        except Exception as e:
            logger.warning("incident_notification_error", error=str(e))

    async def list_incidents(self) -> list[dict]:
        incident_dir = settings.INCIDENT_STORAGE_DIR
        incidents = []
        if not os.path.isdir(incident_dir):
            return incidents
        for filename in sorted(os.listdir(incident_dir), reverse=True):
            if not filename.endswith(".json"):
                continue
            resolved = os.path.exists(os.path.join(incident_dir, filename.replace(".json", ".resolved")))
            filepath = os.path.join(incident_dir, filename)
            try:
                with open(filepath, "r") as f:
                    data = json.load(f)
                data["status"] = "resolved" if resolved else "open"
                incidents.append(data)
            except Exception:
                continue
        return incidents

    async def get_incident(self, incident_id: str) -> dict | None:
        filepath = os.path.join(settings.INCIDENT_STORAGE_DIR, f"{incident_id}.json")
        if not os.path.exists(filepath):
            return None
        with open(filepath, "r") as f:
            data = json.load(f)
        resolved = os.path.exists(filepath.replace(".json", ".resolved"))
        data["status"] = "resolved" if resolved else "open"
        return data
