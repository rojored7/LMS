from datetime import datetime

from fastapi import APIRouter, Depends, Query, Request
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.error_handler import AuthorizationError
from app.models.user import User, UserRole
from app.middleware.rate_limit import limiter
from app.schemas.common import ApiResponse, CamelModel
from app.services.certificate_service import CertificateService

settings = get_settings()

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


class CertificateResponse(CamelModel):
    id: str
    user_id: str
    course_id: str
    certificate_url: str | None = None
    verification_code: str
    issued: bool
    issued_at: datetime


@router.get("")
async def list_my_certificates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = CertificateService(db)
    certs = await service.list_user_certificates(user.id, skip=skip, limit=limit)
    data = [CertificateResponse.model_validate(c).model_dump() for c in certs]
    return ApiResponse(success=True, data=data).model_dump()


class GenerateCertificateRequest(CamelModel):
    course_id: str = Field(min_length=1, max_length=36)


@router.post("/generate")
@limiter.limit(settings.RATE_LIMIT_CERTIFICATE_GENERATE)
async def generate_certificate(
    request: Request,
    body: GenerateCertificateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CertificateService(db)
    cert = await service.generate(user.id, body.course_id)
    return ApiResponse(success=True, data=CertificateResponse.model_validate(cert).model_dump()).model_dump()


@router.get("/verify/{code}")
@limiter.limit("10/minute")
async def verify_certificate(
    request: Request,
    code: str,
    db: AsyncSession = Depends(get_db),
):
    service = CertificateService(db)
    result = await service.verify(code)
    return ApiResponse(success=True, data=result).model_dump()


@router.get("/{certificate_id}")
@limiter.limit(settings.RATE_LIMIT_CERTIFICATE_GET)
async def get_certificate(
    request: Request,
    certificate_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CertificateService(db)
    cert = await service.get_by_id(certificate_id)
    if cert.user_id != user.id and user.role not in (UserRole.ADMIN, UserRole.INSTRUCTOR):
        raise AuthorizationError("No tienes acceso a este certificado")
    return ApiResponse(success=True, data=CertificateResponse.model_validate(cert).model_dump()).model_dump()
