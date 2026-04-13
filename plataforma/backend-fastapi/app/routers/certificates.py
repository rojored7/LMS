from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.common import ApiResponse, CamelModel
from app.services.certificate_service import CertificateService

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
):
    service = CertificateService(db)
    certs = await service.list_user_certificates(user.id)
    data = [CertificateResponse.model_validate(c).model_dump() for c in certs]
    return ApiResponse(success=True, data=data).model_dump()


@router.post("/generate")
async def generate_certificate(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    course_id = body.get("courseId") or body.get("course_id")
    if not course_id:
        return ApiResponse(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": "courseId es requerido"},
        ).model_dump()

    service = CertificateService(db)
    cert = await service.generate(user.id, course_id)
    return ApiResponse(success=True, data=CertificateResponse.model_validate(cert).model_dump()).model_dump()


@router.get("/verify/{code}")
async def verify_certificate(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    service = CertificateService(db)
    result = await service.verify(code)
    return ApiResponse(success=True, data=result).model_dump()


@router.get("/{certificate_id}")
async def get_certificate(
    certificate_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CertificateService(db)
    cert = await service.get_by_id(certificate_id)
    return ApiResponse(success=True, data=CertificateResponse.model_validate(cert).model_dump()).model_dump()
