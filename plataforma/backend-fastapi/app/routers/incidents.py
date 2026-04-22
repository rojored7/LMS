from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.incident_service import IncidentService

settings = get_settings()
router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.post("/webhook/glitchtip")
async def glitchtip_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook receiver for GlitchTip alerts. No auth required (internal network only)."""
    payload = await request.json()
    import structlog
    _log = structlog.get_logger()
    _log.info("glitchtip_webhook_received", payload_keys=list(payload.keys()) if isinstance(payload, dict) else "not_dict")

    # GlitchTip sends Slack-format webhook: {text, attachments[{title, title_link, ...}]}
    # Normalize to our expected format
    if "attachments" in payload and "title" not in payload:
        attachments = payload.get("attachments", [])
        if attachments and isinstance(attachments, list):
            att = attachments[0]
            title_link = att.get("title_link", "")
            # Extract issue ID from URL: .../issues/14 -> 14
            issue_id = title_link.rstrip("/").split("/")[-1] if title_link else None
            payload = {
                "id": issue_id,
                "title": att.get("title", payload.get("text", "Unknown error")),
                "level": "error",
                "url": title_link,
                "project_slug": "lms-platform",
            }
            _log.info("glitchtip_webhook_normalized", issue_id=issue_id, title=payload["title"][:60])
    service = IncidentService(db)
    report = await service.process_webhook(payload)
    return ApiResponse(success=True, data={"incident_id": report.incident_id}).model_dump()


@router.get("")
async def list_incidents(_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """List all incidents (admin only)."""
    service = IncidentService(db)
    incidents = await service.list_incidents()
    return ApiResponse(success=True, data=incidents).model_dump()


@router.get("/{incident_id}")
async def get_incident(incident_id: str, _user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    """Get full incident report (admin only)."""
    service = IncidentService(db)
    incident = await service.get_incident(incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")
    return ApiResponse(success=True, data=incident).model_dump()
