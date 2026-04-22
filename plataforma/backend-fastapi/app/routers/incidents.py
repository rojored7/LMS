import structlog
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import require_admin
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.incident_service import IncidentService

logger = structlog.get_logger()
settings = get_settings()
router = APIRouter(prefix="/api/incidents", tags=["incidents"])


async def _handle_webhook(request: Request, db: AsyncSession) -> dict:
    """Shared handler for webhook processing."""
    payload = await request.json()
    logger.info("glitchtip_webhook_received", payload_keys=list(payload.keys()) if isinstance(payload, dict) else "not_dict")

    # GlitchTip sends Slack-format: {text, attachments[{title, title_link}]}
    if "attachments" in payload and "title" not in payload:
        attachments = payload.get("attachments", [])
        if attachments and isinstance(attachments, list):
            att = attachments[0]
            title_link = att.get("title_link", "")
            issue_id = title_link.rstrip("/").split("/")[-1] if title_link else None
            payload = {
                "id": issue_id,
                "title": att.get("title", payload.get("text", "Unknown error")),
                "level": "error",
                "url": title_link,
                "project_slug": "lms-platform",
            }
            logger.info("glitchtip_webhook_normalized", issue_id=issue_id, title=payload["title"][:60])

    service = IncidentService(db)
    report = await service.process_webhook(payload)
    return {"incident_id": report.incident_id, "error_source": report.error_source}


@router.post("/webhook/glitchtip/{secret}")
@limiter.limit("10/minute")
async def glitchtip_webhook_auth(secret: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook receiver with URL-based secret authentication."""
    if settings.GLITCHTIP_WEBHOOK_SECRET and secret != settings.GLITCHTIP_WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Invalid webhook secret")
    try:
        data = await _handle_webhook(request, db)
        return ApiResponse(success=True, data=data).model_dump()
    except Exception as e:
        logger.error("webhook_processing_failed", error=str(e))
        return ApiResponse(success=False, data={"error": "processing failed"}).model_dump()


@router.post("/webhook/glitchtip")
@limiter.limit("10/minute")
async def glitchtip_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Webhook receiver for internal network (no auth)."""
    try:
        data = await _handle_webhook(request, db)
        return ApiResponse(success=True, data=data).model_dump()
    except Exception as e:
        logger.error("webhook_processing_failed", error=str(e))
        return ApiResponse(success=False, data={"error": "processing failed"}).model_dump()


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
