"""
Incident Service
Processes GlitchTip webhooks, enriches with context, generates diagnostic reports.
Handles both backend (Python) and frontend (React) error formats.
"""

import asyncio
import glob
import json
import os
import re
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

# Atomic counter with lock
_incident_counter = 0
_incident_lock = asyncio.Lock()

# Regex for React componentStack parsing
# Matches: "at ComponentName (http://localhost:3000/src/pages/File.tsx:27:18)"
# Or:      "at div"
_COMPONENT_RE = re.compile(r"at\s+(\S+)(?:\s+\((.+?):(\d+):(\d+)\))?")

# Valid incident ID format
_INCIDENT_ID_RE = re.compile(r"^INC-\d{8}-\d{4}$")

MAX_STACK_FRAMES = 10
MAX_LOG_LINES = 50


def _init_counter() -> None:
    """Initialize counter from existing files to survive restarts."""
    global _incident_counter
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    incident_dir = settings.INCIDENT_STORAGE_DIR
    if os.path.isdir(incident_dir):
        existing = glob.glob(os.path.join(incident_dir, f"INC-{today}-*.json"))
        _incident_counter = len(existing)


# Initialize on module load
try:
    _init_counter()
except Exception:
    pass


class IncidentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _next_id(self) -> str:
        global _incident_counter
        async with _incident_lock:
            _incident_counter += 1
            now = datetime.now(timezone.utc)
            return f"INC-{now.strftime('%Y%m%d')}-{_incident_counter:04d}"

    async def process_webhook(self, payload: dict) -> IncidentReport:
        incident_id = await self._next_id()
        now = datetime.now(timezone.utc)

        title = payload.get("title", "Unknown error")
        level = payload.get("level", "error")
        issue_url = payload.get("url", "")
        issue_id = payload.get("id")

        # Idempotency: skip if already processed this GlitchTip issue
        if issue_id and self._already_processed(issue_id):
            logger.info("incident_deduplicated", issue_id=issue_id)
            existing = self._find_by_glitchtip_id(issue_id)
            if existing:
                return IncidentReport(**existing)

        # 1. Fetch full event from GlitchTip API
        event_data = await self._fetch_event(payload)

        # 2. Normalize tags (GlitchTip returns list of {key, value})
        raw_tags = event_data.get("tags", {}) if event_data else {}
        if isinstance(raw_tags, list):
            tags = {t["key"]: t["value"] for t in raw_tags if "key" in t}
        else:
            tags = raw_tags

        request_id = tags.get("request_id", "")
        contexts = event_data.get("contexts", {}) if event_data else {}
        user_info = event_data.get("user") if event_data else None

        # 3. Detect error source
        error_source = self._detect_error_source(event_data)

        # 4. Extract error based on source
        exception_data = self._extract_error(event_data, error_source, title, contexts)

        # 5. Extract breadcrumbs (safely)
        breadcrumbs = self._extract_breadcrumbs(event_data)

        # 6. Search backend logs by request_id
        backend_logs = []
        if request_id:
            backend_logs = await asyncio.get_event_loop().run_in_executor(
                None, self._search_logs, request_id
            )

        # 7. Fetch user context from DB
        user_context = None
        if user_info and user_info.get("id"):
            user_context = await self._fetch_user_context(user_info["id"])
        elif user_info:
            user_context = {"id": user_info.get("id", "?"), "email": user_info.get("email", "?")}

        # 8. Extract request info
        request_info = contexts.get("request_info")
        if not request_info and event_data:
            req = event_data.get("request", {})
            if req:
                request_info = {"method": req.get("method", "?"), "path": req.get("url", "?"), "query": req.get("query_string", "")}
        if error_source == "frontend" and not request_info:
            page_url = tags.get("url", tags.get("transaction", ""))
            if page_url:
                request_info = {"page_url": page_url}

        # 9. Extract client info (browser/OS) for frontend
        client_info = self._extract_client_info(contexts, tags) if error_source == "frontend" else None

        # 10. Build report
        report = IncidentReport(
            incident_id=incident_id,
            severity=level,
            timestamp=now.isoformat(),
            error_source=error_source,
            error=exception_data,
            user=user_context,
            request=request_info,
            client_info=client_info,
            breadcrumbs=breadcrumbs,
            backend_logs=backend_logs,
            glitchtip_url=issue_url,
            status="open",
        )

        # 11. Save atomically
        await self._save_report(report, glitchtip_issue_id=issue_id)

        # 12. Notify admins
        if settings.INCIDENT_NOTIFY_ADMINS:
            try:
                await self._notify_admins(report)
            except Exception as e:
                logger.warning("incident_notification_error", error=str(e))

        logger.warning("incident_created", incident_id=incident_id, title=title, severity=level, error_source=error_source)
        return report

    # --- Error source detection ---

    @staticmethod
    def _detect_error_source(event_data: dict | None) -> str:
        if not event_data:
            return "unknown"
        exc_values = event_data.get("exception", {}).get("values", [])
        if exc_values and any(v.get("stacktrace", {}).get("frames") for v in exc_values):
            return "backend"
        contexts = event_data.get("contexts", {})
        if "react" in contexts or "browser" in contexts:
            return "frontend"
        return "unknown"

    # --- Error extraction (backend vs frontend) ---

    def _extract_error(self, event_data: dict | None, error_source: str, title: str, contexts: dict) -> dict:
        if not event_data:
            return {"type": "Unknown", "message": title}

        exc_values = event_data.get("exception", {}).get("values", [])

        if error_source == "backend" and exc_values:
            last_exc = exc_values[-1]
            frames = last_exc.get("stacktrace", {}).get("frames", [])
            last_frame = frames[-1] if frames else {}
            return {
                "type": last_exc.get("type", "Unknown"),
                "message": last_exc.get("value", title),
                "file": f"{last_frame.get('filename', '?')}:{last_frame.get('lineno', '?')}",
                "function": last_frame.get("function", "?"),
                "stack_trace": [
                    f"  {f.get('filename', '?')}:{f.get('lineno', '?')} in {f.get('function', '?')}"
                    for f in frames[-MAX_STACK_FRAMES:]
                ],
            }

        if error_source == "frontend":
            component_stack_raw = contexts.get("react", {}).get("componentStack", "")
            parsed_frames = self._parse_component_stack(component_stack_raw)
            first_frame = parsed_frames[0] if parsed_frames else {}

            error_type, error_msg = self._split_error_title(title)
            return {
                "type": error_type,
                "message": error_msg,
                "file": first_frame.get("file", "?"),
                "function": first_frame.get("component", "?"),
                "stack_trace": [
                    f"  {f.get('file', '?')} in <{f.get('component', '?')}>"
                    for f in parsed_frames
                ],
                "component_stack": parsed_frames,
            }

        return {"type": "Unknown", "message": title}

    @staticmethod
    def _split_error_title(title: str) -> tuple[str, str]:
        """Split 'TypeError: Cannot read...' into ('TypeError', 'Cannot read...')"""
        if ":" in title:
            parts = title.split(":", 1)
            if " " not in parts[0].strip():
                return parts[0].strip(), parts[1].strip()
        return "Unknown", title

    # --- React componentStack parser ---

    @staticmethod
    def _parse_component_stack(raw: str) -> list[dict]:
        frames = []
        for line in raw.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            m = _COMPONENT_RE.search(line)
            if m:
                component = m.group(1)
                url = m.group(2) or ""
                lineno = m.group(3) or "?"
                filename = url.split("//", 1)[-1].split("/", 1)[-1] if "//" in url else url
                frames.append({
                    "component": component,
                    "file": f"{filename}:{lineno}" if filename else "",
                    "function": component,
                })
            else:
                name = line.replace("at ", "").strip()
                if name:
                    frames.append({"component": name, "file": "", "function": name})
        return frames

    # --- Client info extraction ---

    @staticmethod
    def _extract_client_info(contexts: dict, tags: dict) -> dict | None:
        browser = contexts.get("browser")
        os_info = contexts.get("os")
        if not browser and not os_info:
            browser_tag = tags.get("browser", "")
            os_tag = tags.get("os.name", "")
            if not browser_tag and not os_tag:
                return None
            return {"browser": {"name": browser_tag} if browser_tag else None, "os": {"name": os_tag} if os_tag else None}
        return {"browser": browser, "os": os_info}

    # --- Breadcrumbs extraction ---

    @staticmethod
    def _extract_breadcrumbs(event_data: dict | None) -> list[dict]:
        if not event_data:
            return []
        raw = event_data.get("breadcrumbs")
        if not raw or not isinstance(raw, (dict, list)):
            return []
        values = raw.get("values", []) if isinstance(raw, dict) else raw
        if not isinstance(values, list):
            return []
        breadcrumbs = []
        for b in values:
            breadcrumbs.append({
                "time": b.get("timestamp", ""),
                "type": b.get("category", b.get("type", "")),
                "message": b.get("message", ""),
                "data": b.get("data", {}),
                "level": b.get("level", "info"),
            })
        return breadcrumbs

    # --- GlitchTip API fetch ---

    async def _fetch_event(self, payload: dict) -> dict | None:
        if not settings.GLITCHTIP_API_TOKEN or not settings.GLITCHTIP_INTERNAL_URL:
            return payload.get("event")

        issue_id = payload.get("id")
        if not issue_id:
            url = payload.get("url", "")
            parts = url.rstrip("/").split("/")
            issue_id = parts[-1] if parts else None

        if not issue_id:
            return payload.get("event")

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{settings.GLITCHTIP_INTERNAL_URL}/api/0/issues/{issue_id}/events/latest/",
                    headers={"Authorization": f"Bearer {settings.GLITCHTIP_API_TOKEN}"},
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("glitchtip_api_non_200", status=resp.status_code, issue_id=issue_id)
        except Exception as e:
            logger.warning("glitchtip_api_error", error=str(e))

        return payload.get("event")

    # --- Log search (runs in executor, non-blocking) ---

    def _search_logs(self, request_id: str) -> list[str]:
        log_dir = settings.LOG_DIR
        logs: list[str] = []
        try:
            for filename in sorted(os.listdir(log_dir), reverse=True):
                if not filename.endswith(".log"):
                    continue
                filepath = os.path.join(log_dir, filename)
                try:
                    with open(filepath, "r", errors="replace") as f:
                        for line in f:
                            if request_id in line:
                                logs.append(line.strip())
                                if len(logs) >= MAX_LOG_LINES:
                                    return logs
                except Exception:
                    continue
        except Exception:
            pass
        return logs

    # --- User context from DB ---

    async def _fetch_user_context(self, user_id: str) -> dict | None:
        try:
            result = await self.db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                return None
            enrollment_count = await self.db.execute(
                select(func.count()).select_from(Enrollment).where(Enrollment.user_id == user_id)
            )
            return {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role.value if user.role else "UNKNOWN",
                "xp": user.xp or 0,
                "enrolled_courses": enrollment_count.scalar() or 0,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }
        except Exception as e:
            logger.warning("user_context_error", error=str(e), user_id=user_id)
            return {"id": user_id}

    # --- Atomic file save ---

    async def _save_report(self, report: IncidentReport, glitchtip_issue_id: str | None = None) -> None:
        incident_dir = settings.INCIDENT_STORAGE_DIR
        os.makedirs(incident_dir, exist_ok=True)
        filepath = os.path.join(incident_dir, f"{report.incident_id}.json")
        tmp_path = filepath + ".tmp"
        data = report.model_dump()
        if glitchtip_issue_id:
            data["glitchtip_issue_id"] = glitchtip_issue_id
        with open(tmp_path, "w") as f:
            json.dump(data, f, indent=2, default=str)
        os.replace(tmp_path, filepath)
        logger.info("incident_saved", path=filepath)

    # --- Admin notifications ---

    async def _notify_admins(self, report: IncidentReport) -> None:
        result = await self.db.execute(select(User).where(User.role == UserRole.ADMIN).limit(5))
        admins = list(result.scalars().all())
        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                title=f"Incidente: {report.error.get('type', 'Error')}",
                message=f"{report.error.get('message', '')[:100]} - {report.incident_id}",
                type=NotificationType.INCIDENT,
                data={"incident_id": report.incident_id, "severity": report.severity, "error_source": report.error_source, "glitchtip_url": report.glitchtip_url},
            )
            self.db.add(notification)
        await self.db.flush()

    # --- Idempotency ---

    def _already_processed(self, glitchtip_issue_id: str) -> bool:
        incident_dir = settings.INCIDENT_STORAGE_DIR
        if not os.path.isdir(incident_dir):
            return False
        for filename in os.listdir(incident_dir):
            if not filename.endswith(".json"):
                continue
            filepath = os.path.join(incident_dir, filename)
            try:
                with open(filepath, "r") as f:
                    data = json.load(f)
                if str(data.get("glitchtip_issue_id")) == str(glitchtip_issue_id):
                    return True
            except Exception:
                continue
        return False

    def _find_by_glitchtip_id(self, glitchtip_issue_id: str) -> dict | None:
        incident_dir = settings.INCIDENT_STORAGE_DIR
        if not os.path.isdir(incident_dir):
            return None
        for filename in os.listdir(incident_dir):
            if not filename.endswith(".json"):
                continue
            try:
                with open(os.path.join(incident_dir, filename), "r") as f:
                    data = json.load(f)
                if str(data.get("glitchtip_issue_id")) == str(glitchtip_issue_id):
                    return data
            except Exception:
                continue
        return None

    # --- List / Get ---

    async def list_incidents(self, limit: int = 50) -> list[dict]:
        incident_dir = settings.INCIDENT_STORAGE_DIR
        if not os.path.isdir(incident_dir):
            return []
        incidents = []
        for filename in sorted(os.listdir(incident_dir), reverse=True):
            if not filename.endswith(".json"):
                continue
            try:
                with open(os.path.join(incident_dir, filename), "r") as f:
                    incidents.append(json.load(f))
            except Exception:
                continue
            if len(incidents) >= limit:
                break
        return incidents

    async def get_incident(self, incident_id: str) -> dict | None:
        if not _INCIDENT_ID_RE.fullmatch(incident_id):
            return None
        filepath = os.path.realpath(os.path.join(settings.INCIDENT_STORAGE_DIR, f"{incident_id}.json"))
        base = os.path.realpath(settings.INCIDENT_STORAGE_DIR)
        if not filepath.startswith(base + os.sep):
            return None
        if not os.path.exists(filepath):
            return None
        with open(filepath, "r") as f:
            return json.load(f)
