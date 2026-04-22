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
    """Webhook receiver for GlitchTip alerts."""
    if settings.GLITCHTIP_WEBHOOK_SECRET:
        secret = request.headers.get("X-Glitchtip-Secret", "")
        if secret != settings.GLITCHTIP_WEBHOOK_SECRET:
            raise HTTPException(status_code=401, detail="Invalid webhook secret")

    payload = await request.json()
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
