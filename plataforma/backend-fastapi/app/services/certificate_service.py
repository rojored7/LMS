import secrets

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError, ValidationError
from app.models.gamification import Certificate
from app.models.progress import Enrollment

logger = structlog.get_logger()


class CertificateService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, certificate_id: str) -> Certificate:
        result = await self.db.execute(select(Certificate).where(Certificate.id == certificate_id))
        cert = result.scalar_one_or_none()
        if not cert:
            raise NotFoundError("Certificado no encontrado")
        return cert

    async def get_by_verification_code(self, code: str) -> Certificate:
        result = await self.db.execute(select(Certificate).where(Certificate.verification_code == code))
        cert = result.scalar_one_or_none()
        if not cert:
            raise NotFoundError("Certificado no encontrado")
        return cert

    async def list_user_certificates(self, user_id: str, skip: int = 0, limit: int = 50) -> list[Certificate]:
        result = await self.db.execute(
            select(Certificate).where(Certificate.user_id == user_id)
            .order_by(Certificate.issued_at.desc())
            .offset(skip).limit(limit)
        )
        return list(result.scalars().all())

    async def generate(self, user_id: str, course_id: str) -> Certificate:
        existing_result = await self.db.execute(
            select(Certificate).where(Certificate.user_id == user_id, Certificate.course_id == course_id)
        )
        existing = existing_result.scalar_one_or_none()
        if existing:
            raise ConflictError("Ya existe un certificado para este curso")

        enrollment_result = await self.db.execute(
            select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        )
        enrollment = enrollment_result.scalar_one_or_none()
        if not enrollment:
            raise ValidationError("No estas inscrito en este curso")
        if enrollment.progress < 100:
            raise ValidationError("Debes completar el curso al 100% para obtener el certificado")

        verification_code = f"CERT-{secrets.token_hex(8).upper()}"
        cert = Certificate(
            user_id=user_id,
            course_id=course_id,
            verification_code=verification_code,
        )
        self.db.add(cert)
        await self.db.flush()
        logger.info("certificate_generated", user_id=user_id, course_id=course_id, code=verification_code)
        return cert

    async def verify(self, code: str) -> dict:
        cert = await self.get_by_verification_code(code)
        return {
            "valid": True,
            "certificateId": cert.id,
            "userId": cert.user_id,
            "courseId": cert.course_id,
            "issuedAt": cert.issued_at.isoformat(),
            "verificationCode": cert.verification_code,
        }
