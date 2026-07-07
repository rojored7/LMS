import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi import Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user, require_role
from app.middleware.rate_limit import limiter
from app.models.course import Lesson, Module
from app.models.user import User, UserRole
from app.schemas.attachment import AttachmentResponse
from app.schemas.common import ApiResponse
from app.services.attachment_service import AttachmentService
from app.utils.enrollment_check import verify_enrollment_or_staff

router = APIRouter(prefix="/api/attachments", tags=["attachments"])
settings = get_settings()


def _build_response(attachment) -> dict:
    return AttachmentResponse(
        id=attachment.id,
        lesson_id=attachment.lesson_id,
        original_filename=attachment.original_filename,
        file_size=attachment.file_size,
        mime_type=attachment.mime_type,
        description=attachment.description,
        uploaded_by=attachment.uploaded_by,
        created_at=attachment.created_at,
        download_url=attachment.file_path,
    ).model_dump()


@router.get("/lesson/{lesson_id}")
async def list_attachments(
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Leccion no encontrada")
    module = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one_or_none()
    if module is None:
        raise HTTPException(status_code=404, detail="Modulo no encontrado")
    await verify_enrollment_or_staff(db, current_user.id, module.course_id, current_user.role)

    uploads_dir = os.environ.get("UPLOADS_DIR", "/app/uploads")
    service = AttachmentService(db, uploads_dir)
    attachments = await service.list_for_lesson(lesson_id)
    return ApiResponse(
        success=True,
        data=[_build_response(a) for a in attachments],
    ).model_dump()


@router.post("/lesson/{lesson_id}")
@limiter.limit("20/hour")
async def upload_attachment(
    request: Request,
    lesson_id: str,
    file: UploadFile,
    description: str | None = None,
    current_user: User = Depends(require_role(UserRole.INSTRUCTOR)),
    db: AsyncSession = Depends(get_db),
) -> dict:
    content = await file.read()
    uploads_dir = os.environ.get("UPLOADS_DIR", "/app/uploads")
    service = AttachmentService(db, uploads_dir)

    try:
        attachment = await service.upload(
            lesson_id=lesson_id,
            filename=file.filename or "archivo",
            content=content,
            mime_type=file.content_type or "application/octet-stream",
            uploader_id=current_user.id,
            description=description,
        )
    except (ValueError, PermissionError) as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    await db.commit()
    return ApiResponse(success=True, data=_build_response(attachment)).model_dump()


@router.delete("/{attachment_id}")
async def delete_attachment(
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    uploads_dir = os.environ.get("UPLOADS_DIR", "/app/uploads")
    service = AttachmentService(db, uploads_dir)
    is_admin = current_user.role == UserRole.ADMIN

    try:
        await service.delete(attachment_id, current_user.id, is_admin)
    except (ValueError, PermissionError) as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    await db.commit()
    return ApiResponse(success=True, data={"message": "Adjunto eliminado"}).model_dump()
