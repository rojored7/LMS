import asyncio
import math
import shutil
import tempfile
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database import get_db
from app.middleware.auth import require_instructor
from app.middleware.error_handler import AuthorizationError, NotFoundError
from app.models.course import Course, Module, Lesson, LessonType
from app.models.user import User, UserRole
from app.schemas.common import PaginationMeta
from app.schemas.course import CourseResponse

logger = structlog.get_logger()

router = APIRouter(prefix="/api/admin/courses", tags=["course-management"])

MAX_ZIP_SIZE = 100 * 1024 * 1024
MAX_EXTRACTED_SIZE = 500 * 1024 * 1024
MAX_ZIP_FILES = 5000


async def _extract_zip_to_temp(upload: UploadFile) -> Path:
    tmp = Path(tempfile.mkdtemp(prefix="course_import_"))
    zip_path = tmp / "upload.zip"
    content = await upload.read()
    if not content:
        raise ValueError("Archivo vacio")
    if len(content) > MAX_ZIP_SIZE:
        raise ValueError(f"ZIP excede el tamano maximo ({MAX_ZIP_SIZE // (1024 * 1024)} MB)")
    await asyncio.to_thread(zip_path.write_bytes, content)
    if not zipfile.is_zipfile(zip_path):
        raise ValueError("El archivo no es un ZIP valido.")
    with zipfile.ZipFile(zip_path, "r") as zf:
        total_size = sum(info.file_size for info in zf.infolist())
        if total_size > MAX_EXTRACTED_SIZE:
            raise ValueError(f"Contenido excede el tamano maximo ({MAX_EXTRACTED_SIZE // (1024 * 1024)} MB)")
        if len(zf.infolist()) > MAX_ZIP_FILES:
            raise ValueError(f"ZIP contiene demasiados archivos (max {MAX_ZIP_FILES})")
        dest = (tmp / "extracted").resolve()
        for info in zf.infolist():
            info.filename = info.filename.replace("\\", "/")
            target = (dest / info.filename).resolve()
            if not str(target).startswith(str(dest)):
                raise ValueError(f"Ruta insegura detectada en el ZIP: {info.filename}")
            zf.extract(info, dest)
    extracted = tmp / "extracted"
    for candidate in [extracted] + list(extracted.iterdir()):
        if candidate.is_dir() and (candidate / "config.json").exists():
            return candidate
    dirs = [d for d in extracted.iterdir() if d.is_dir()]
    return dirs[0] if dirs else extracted


def _parse_course_dir(course_dir: Path):
    from app.scripts.parsers.course_parser import find_module_dirs, parse_course
    from app.scripts.parsers.lesson_parser import parse_lessons
    from app.scripts.parsers.module_parser import parse_module
    from app.scripts.parsers.quiz_parser import parse_quizzes
    from app.scripts.parsers.lab_parser import parse_labs
    from app.scripts.parsers.project_parser import parse_projects

    course = parse_course(course_dir)
    for mdir in find_module_dirs(course_dir):
        pm = parse_module(mdir)
        pm.lessons = parse_lessons(mdir)
        pm.quizzes = parse_quizzes(mdir)
        pm.labs = parse_labs(mdir)
        course.modules.append(pm)
    course.projects = parse_projects(course_dir)
    return course


@router.post("/import/validate")
async def validate_import(
    courseZip: UploadFile = File(...),
    _user: User = Depends(require_instructor),
) -> dict:
    tmp_dir = None
    try:
        course_dir = await _extract_zip_to_temp(courseZip)
        tmp_dir = course_dir
        while tmp_dir.parent != tmp_dir and not str(tmp_dir.parent).endswith(tempfile.gettempdir()):
            tmp_dir = tmp_dir.parent

        parsed = _parse_course_dir(course_dir)
        preview = {
            "title": parsed.title,
            "description": parsed.description,
            "level": parsed.level,
            "duration": parsed.duration,
            "modules": [
                {"title": m.title, "lessons": len(m.lessons), "quizzes": len(m.quizzes), "labs": len(m.labs)}
                for m in parsed.modules
            ],
        }
        return {"success": True, "data": {"valid": True, "errors": [], "warnings": [], "preview": preview}}
    except Exception as e:
        logger.error("import_validation_failed", error=str(e))
        return {"success": True, "data": {"valid": False, "errors": [{"field": "courseZip", "message": str(e)}], "warnings": []}}
    finally:
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)


@router.post("/import")
async def import_course_zip(
    courseZip: UploadFile = File(...),
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    tmp_dir = None
    try:
        course_dir = await _extract_zip_to_temp(courseZip)
        tmp_dir = course_dir
        while tmp_dir.parent != tmp_dir and "course_import_" not in tmp_dir.name:
            tmp_dir = tmp_dir.parent

        parsed = _parse_course_dir(course_dir)

        from app.scripts.importers.db_importer import import_course_to_db
        course_id = await import_course_to_db(parsed, db, publish=True, force=True)
        await db.flush()

        return {"success": True, "data": {"courseId": course_id, "title": parsed.title, "message": f"Curso '{parsed.title}' importado exitosamente"}}
    except ValueError as e:
        logger.error("course_import_validation_failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("course_import_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Error al importar curso: {str(e)}")
    finally:
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)


@router.get("")
async def list_all_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    base_filter = Course.author_id == _user.id if _user.role == UserRole.INSTRUCTOR else True
    total = (await db.execute(select(func.count()).select_from(Course).where(base_filter))).scalar() or 0
    offset = (page - 1) * limit
    result = await db.execute(select(Course).where(base_filter).offset(offset).limit(limit).order_by(Course.created_at.desc()))
    courses = result.scalars().all()
    return {
        "success": True,
        "data": [CourseResponse.model_validate(c).model_dump() for c in courses],
        "meta": PaginationMeta(total=total, page=page, limit=limit, pages=math.ceil(total / limit) if limit else 0),
    }


@router.get("/{course_id}")
async def get_course_admin(
    course_id: str,
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course is None:
        raise NotFoundError("Curso no encontrado")
    return {"success": True, "data": CourseResponse.model_validate(course).model_dump()}


@router.post("/{course_id}/publish")
async def publish_course(
    course_id: str,
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course is None:
        raise NotFoundError("Curso no encontrado")
    if _user.role == UserRole.INSTRUCTOR and course.author_id != _user.id:
        raise AuthorizationError("No tiene permisos sobre este curso")
    course.is_published = True
    await db.flush()
    return {"success": True, "data": CourseResponse.model_validate(course).model_dump()}


@router.post("/{course_id}/unpublish")
async def unpublish_course(
    course_id: str,
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course is None:
        raise NotFoundError("Curso no encontrado")
    if _user.role == UserRole.INSTRUCTOR and course.author_id != _user.id:
        raise AuthorizationError("No tiene permisos sobre este curso")
    course.is_published = False
    await db.flush()
    return {"success": True, "data": CourseResponse.model_validate(course).model_dump()}
