import re

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.permissions import Permission, require_permission
from app.services.export_service import ExportService

router = APIRouter(prefix="/api/export", tags=["export"])

_CSV_HEADERS = {
    "Content-Disposition": "attachment",
    "Cache-Control": "no-store",
}
_SAFE_FILENAME_RE = re.compile(r"[^a-zA-Z0-9_-]")


@router.get("/enrollments")
@limiter.limit("5/hour")
async def export_enrollments(
    request: Request,
    course_id: str | None = None,
    current_user: User = Depends(require_permission(Permission.EXPORT_DATA)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    service = ExportService(db)
    csv_data = await service.export_enrollments_csv(course_id=course_id)
    safe_id = _SAFE_FILENAME_RE.sub("_", course_id) if course_id else "todos"
    filename = f"inscripciones_{safe_id}.csv"
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={**_CSV_HEADERS, "Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/progress/{course_id}")
@limiter.limit("5/hour")
async def export_progress(
    request: Request,
    course_id: str,
    current_user: User = Depends(require_permission(Permission.EXPORT_DATA)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    service = ExportService(db)
    csv_data = await service.export_progress_csv(course_id=course_id)
    safe_id = _SAFE_FILENAME_RE.sub("_", course_id)
    filename = f"progreso_{safe_id}.csv"
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={**_CSV_HEADERS, "Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/courses/stats")
@limiter.limit("5/hour")
async def export_course_stats(
    request: Request,
    current_user: User = Depends(require_permission(Permission.EXPORT_DATA)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    service = ExportService(db)
    csv_data = await service.export_course_stats_csv()
    return StreamingResponse(
        iter([csv_data]),
        media_type="text/csv",
        headers={**_CSV_HEADERS, "Content-Disposition": 'attachment; filename="estadisticas_cursos.csv"'},
    )
