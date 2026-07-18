import os
import secrets
from datetime import datetime

import structlog
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError, ValidationError
from app.models.course import Course
from app.models.gamification import Certificate
from app.models.progress import Enrollment
from app.models.user import User

logger = structlog.get_logger()

_MONTHS_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def _generate_certificate_pdf(
    cert_id: str,
    user_name: str,
    course_title: str,
    issued_at: datetime,
    verification_code: str,
) -> str:
    uploads_dir = os.environ.get("UPLOADS_DIR", "/app/uploads")
    cert_dir = os.path.join(uploads_dir, "certificates")
    os.makedirs(cert_dir, exist_ok=True)
    filename = f"{cert_id}.pdf"
    filepath = os.path.join(cert_dir, filename)

    pw, ph = landscape(A4)
    c = canvas.Canvas(filepath, pagesize=landscape(A4))

    # Fondo
    c.setFillColor(HexColor("#F0F8FF"))
    c.rect(0, 0, pw, ph, fill=True, stroke=False)

    # Borde exterior
    c.setStrokeColor(HexColor("#1E40AF"))
    c.setLineWidth(4)
    c.rect(1 * cm, 1 * cm, pw - 2 * cm, ph - 2 * cm, fill=False, stroke=True)
    c.setLineWidth(1)
    c.rect(1.3 * cm, 1.3 * cm, pw - 2.6 * cm, ph - 2.6 * cm, fill=False, stroke=True)

    # Titulo
    c.setFont("Helvetica-Bold", 36)
    c.setFillColor(HexColor("#1E3A5F"))
    c.drawCentredString(pw / 2, ph - 4 * cm, "CERTIFICADO DE PARTICIPACION")
    c.setStrokeColor(HexColor("#1E40AF"))
    c.setLineWidth(2)
    c.line(5 * cm, ph - 4.8 * cm, pw - 5 * cm, ph - 4.8 * cm)

    # "Se certifica que:"
    c.setFont("Helvetica", 16)
    c.setFillColor(HexColor("#374151"))
    c.drawCentredString(pw / 2, ph - 6.5 * cm, "Se certifica que:")

    # Nombre del estudiante
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(HexColor("#1E40AF"))
    c.drawCentredString(pw / 2, ph - 8.5 * cm, user_name)

    # "ha completado satisfactoriamente el curso:"
    c.setFont("Helvetica", 16)
    c.setFillColor(HexColor("#374151"))
    c.drawCentredString(pw / 2, ph - 10 * cm, "ha completado satisfactoriamente el curso:")

    # Titulo del curso
    c.setFont("Helvetica-Bold", 22)
    c.setFillColor(HexColor("#1E3A5F"))
    c.drawCentredString(pw / 2, ph - 12 * cm, course_title)

    # Fecha
    date_str = f"{issued_at.day} de {_MONTHS_ES[issued_at.month - 1]} de {issued_at.year}"
    c.setFont("Helvetica", 14)
    c.setFillColor(HexColor("#6B7280"))
    c.drawCentredString(pw / 2, ph - 14 * cm, f"Fecha de emision: {date_str}")

    # Pie con codigo de verificacion
    c.setFont("Helvetica", 10)
    c.drawCentredString(pw / 2, 2 * cm, f"Codigo de verificacion: {verification_code}")

    c.save()
    return f"/api/uploads/certificates/{filename}"


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

        user = await self.db.get(User, user_id)
        course = await self.db.get(Course, course_id)
        if user and course:
            try:
                url = _generate_certificate_pdf(
                    cert_id=cert.id,
                    user_name=user.name or user.email,
                    course_title=course.title,
                    issued_at=cert.issued_at,
                    verification_code=cert.verification_code,
                )
                cert.certificate_url = url
                await self.db.flush()
            except Exception:
                logger.exception("certificate_pdf_generation_failed", cert_id=cert.id)

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
