import os
import secrets

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError
from app.models.content import Attachment
from app.models.course import Lesson

logger = structlog.get_logger()

_ALLOWED_MIMES: frozenset[str] = frozenset({
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "text/plain",
    "text/csv",
    "text/markdown",
})

_ALLOWED_EXTENSIONS: frozenset[str] = frozenset({
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp",
    ".docx", ".xlsx", ".zip", ".txt", ".csv", ".md",
})

_MAGIC_BYTES: dict[bytes, str] = {
    b"%PDF": "application/pdf",
    b"\x89PNG": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
    b"GIF8": "image/gif",
    b"PK\x03\x04": "application/zip",
}

MAX_FILE_SIZE = 50 * 1024 * 1024


class AttachmentService:
    def __init__(self, db: AsyncSession, uploads_dir: str) -> None:
        self.db = db
        self.uploads_dir = uploads_dir

    async def list_for_lesson(self, lesson_id: str) -> list[Attachment]:
        result = await self.db.execute(
            select(Attachment).where(Attachment.lesson_id == lesson_id).order_by(Attachment.created_at)
        )
        return list(result.scalars().all())

    async def upload(
        self,
        lesson_id: str,
        filename: str,
        content: bytes,
        mime_type: str,
        uploader_id: str,
        description: str | None = None,
    ) -> Attachment:
        result = await self.db.execute(select(Lesson).where(Lesson.id == lesson_id))
        if result.scalar_one_or_none() is None:
            raise NotFoundError("Leccion no encontrada")

        ext = os.path.splitext(filename)[1].lower()
        if ext not in _ALLOWED_EXTENSIONS:
            raise ValueError(f"Extension no permitida: {ext}")

        if len(content) > MAX_FILE_SIZE:
            raise ValueError(f"Archivo excede el limite de {MAX_FILE_SIZE // (1024 * 1024)}MB")

        detected = self._detect_mime(content)
        if detected not in _ALLOWED_MIMES and mime_type not in _ALLOWED_MIMES:
            raise ValueError("Tipo de archivo no permitido")

        effective_mime = detected or mime_type

        dest_dir = os.path.realpath(os.path.join(self.uploads_dir, "lessons", lesson_id))
        os.makedirs(dest_dir, exist_ok=True)

        safe_name = secrets.token_hex(16) + ext
        filepath = os.path.realpath(os.path.join(dest_dir, safe_name))
        if not filepath.startswith(dest_dir + os.sep):
            raise ValueError("Ruta de archivo invalida")

        with open(filepath, "wb") as f:
            f.write(content)

        attachment = Attachment(
            lesson_id=lesson_id,
            original_filename=filename[:500],
            stored_filename=safe_name,
            file_path=f"/api/uploads/lessons/{lesson_id}/{safe_name}",
            file_size=len(content),
            mime_type=effective_mime,
            description=description,
            uploaded_by=uploader_id,
        )
        self.db.add(attachment)
        await self.db.flush()
        logger.info("attachment_uploaded", attachment_id=attachment.id, lesson_id=lesson_id)
        return attachment

    async def delete(self, attachment_id: str, requester_id: str, is_admin: bool) -> None:
        result = await self.db.execute(select(Attachment).where(Attachment.id == attachment_id))
        attachment = result.scalar_one_or_none()
        if attachment is None:
            raise NotFoundError("Adjunto no encontrado")
        if not is_admin and attachment.uploaded_by != requester_id:
            raise PermissionError("No autorizado para eliminar este adjunto")

        base = os.path.realpath(self.uploads_dir)
        filepath = os.path.realpath(
            os.path.join(self.uploads_dir, "lessons", attachment.lesson_id, attachment.stored_filename)
        )
        if filepath.startswith(base + os.sep) and os.path.exists(filepath):
            os.remove(filepath)

        await self.db.delete(attachment)
        await self.db.flush()
        logger.info("attachment_deleted", attachment_id=attachment_id)

    @staticmethod
    def _detect_mime(content: bytes) -> str | None:
        for magic, mime in _MAGIC_BYTES.items():
            if content[: len(magic)] == magic:
                return mime
        return None
