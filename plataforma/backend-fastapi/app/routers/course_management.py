import asyncio
import math
import shutil
import tempfile
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy import func, select, true as sa_true
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database import get_db
from app.middleware.auth import require_instructor, require_instructor_only
from app.middleware.error_handler import AuthorizationError, NotFoundError
from app.models.course import Course, Module, Lesson, LessonType
from app.models.progress import Enrollment
from app.models.user import User, UserRole
from app.schemas.common import PaginationMeta
from app.schemas.course import (
    AdminCourseCreate,
    CourseResponse,
    CourseUpdate,
    LessonCreate,
    LessonResponse,
    LessonUpdate,
    ModuleAdminResponse,
    ModuleCreate,
    LessonReorderRequest,
    ModuleReorderRequest,
    ModuleUpdate,
)
from app.services.course_service import CourseService
from app.services.lesson_service import LessonService
from app.services.module_service import ModuleService

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
    _user: User = Depends(require_instructor_only),
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
    except ValueError as e:
        return {"success": True, "data": {"valid": False, "errors": [{"field": "courseZip", "message": str(e)}], "warnings": []}}
    except Exception as e:
        logger.error("import_validation_failed", error=str(e), exc_info=True)
        return {"success": True, "data": {"valid": False, "errors": [{"field": "courseZip", "message": "Error al validar el archivo ZIP"}], "warnings": []}}
    finally:
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)


@router.post("/import")
async def import_course_zip(
    courseZip: UploadFile = File(...),
    _user: User = Depends(require_instructor_only),
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
        course_id = await import_course_to_db(parsed, db, publish=False, force=True)
        await db.flush()

        return {"success": True, "data": {"courseId": course_id, "title": parsed.title, "message": f"Curso '{parsed.title}' importado exitosamente"}}
    except ValueError as e:
        logger.error("course_import_validation_failed", error=str(e))
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("course_import_failed", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Error interno al importar el curso")
    finally:
        if tmp_dir and tmp_dir.exists():
            shutil.rmtree(tmp_dir, ignore_errors=True)


def _slugify(text: str) -> str:
    import re
    import unicodedata
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text.lower().strip())
    return re.sub(r"[-\s]+", "-", text)


@router.post("")
async def create_course(
    body: AdminCourseCreate,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    slug = _slugify(body.title)
    # Ensure unique slug
    existing = await db.execute(select(Course).where(Course.slug == slug))
    if existing.scalar_one_or_none():
        import uuid
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    course_svc = CourseService(db)
    course = await course_svc.create_course(
        slug=slug,
        title=body.title,
        description=body.description,
        duration=body.duration,
        level=body.level,
        author=_user.name,
        tags=body.tags or [],
        author_id=_user.id,
    )

    mod_svc = ModuleService(db)
    les_svc = LessonService(db)
    for mod_data in body.modules:
        module = await mod_svc.create(course.id, {
            "title": mod_data.title,
            "description": mod_data.description,
            "order": mod_data.order,
            "duration": 0,
        })
        for les_data in mod_data.lessons:
            await les_svc.create(module.id, {
                "title": les_data.title,
                "content": les_data.content,
                "order": les_data.order,
                "estimated_time": 0,
            })

    logger.info("course_created_via_wizard", course_id=course.id, title=body.title, modules=len(body.modules))
    return {"success": True, "data": {"id": course.id, "slug": course.slug, "title": course.title}}


@router.get("")
async def list_all_courses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    base_filter = Course.author_id == _user.id if _user.role == UserRole.INSTRUCTOR else sa_true()
    total = (await db.execute(select(func.count()).select_from(Course).where(base_filter))).scalar() or 0
    offset = (page - 1) * limit
    mod_count_q = select(func.count(Module.id)).where(Module.course_id == Course.id).correlate(Course).scalar_subquery()
    enroll_count_q = select(func.count(Enrollment.id)).where(Enrollment.course_id == Course.id).correlate(Course).scalar_subquery()
    result = await db.execute(
        select(Course, mod_count_q.label("mod_count"), enroll_count_q.label("enroll_count"))
        .where(base_filter).offset(offset).limit(limit).order_by(Course.created_at.desc())
    )
    data = []
    for c, mod_count, enroll_count in result.all():
        d = CourseResponse.model_validate(c).model_dump()
        d["moduleCount"] = mod_count or 0
        d["enrollmentCount"] = enroll_count or 0
        data.append(d)
    return {
        "success": True,
        "data": data,
        "meta": PaginationMeta(total=total, page=page, limit=limit, pages=math.ceil(total / limit) if limit else 0),
    }


@router.get("/{course_id}")
async def get_course_admin(
    course_id: str,
    _user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from sqlalchemy import true as sa_true
    from sqlalchemy.orm import selectinload
    from app.models.assessment import Quiz as QuizModel
    # Ownership filter in query (not after load) to prevent authorization oracle
    author_filter = Course.author_id == _user.id if _user.role == UserRole.INSTRUCTOR else sa_true()
    enroll_count_q = select(func.count(Enrollment.id)).where(Enrollment.course_id == Course.id).correlate(Course).scalar_subquery()
    result = await db.execute(
        select(Course, enroll_count_q.label("enroll_count"))
        .options(
            selectinload(Course.modules).selectinload(Module.lessons),
            selectinload(Course.modules).selectinload(Module.quizzes).selectinload(QuizModel.questions),
            selectinload(Course.modules).selectinload(Module.labs),
        )
        .where(Course.id == course_id, author_filter)
    )
    row = result.unique().one_or_none()
    if row is None:
        raise NotFoundError("Curso no encontrado")
    course, enroll_count = row
    from app.schemas.course import CourseAdminDetailResponse
    d = CourseAdminDetailResponse.model_validate(course).model_dump()
    d["enrollmentCount"] = enroll_count or 0
    # Enrich quiz/lab counts - match by ID (not position) for order safety
    for mod_data, mod_obj in zip(d.get("modules", []), course.modules):
        quiz_by_id = {q.id: q for q in mod_obj.quizzes}
        for quiz_data in mod_data.get("quizzes", []):
            qobj = quiz_by_id.get(quiz_data.get("id"))
            if qobj:
                quiz_data["questionCount"] = len(qobj.questions) if qobj.questions else 0
                quiz_data["passingScore"] = qobj.passing_score
        lab_by_id = {lb.id: lb for lb in mod_obj.labs}
        for lab_data in mod_data.get("labs", []):
            lobj = lab_by_id.get(lab_data.get("id"))
            if lobj:
                tests = lobj.tests
                if isinstance(tests, list):
                    lab_data["testCaseCount"] = len(tests)
                elif isinstance(tests, dict):
                    lab_data["testCaseCount"] = len(tests.get("cases", tests.get("tests", [])))
                else:
                    lab_data["testCaseCount"] = 0
    return {"success": True, "data": d}


@router.put("/{course_id}")
async def update_course(
    course_id: str,
    data: CourseUpdate,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    service = CourseService(db)
    course = await service.update_course(
        course_id, **data.model_dump(exclude_unset=True, by_alias=False)
    )
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


async def _verify_course_ownership(course_id: str, user: User, db: AsyncSession) -> Course:
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()
    if course is None:
        raise NotFoundError("Curso no encontrado")
    if user.role == UserRole.INSTRUCTOR and course.author_id != user.id:
        raise AuthorizationError("No tiene permisos sobre este curso")
    return course


async def _verify_module_in_course(module_id: str, course_id: str, db: AsyncSession) -> Module:
    result = await db.execute(select(Module).where(Module.id == module_id, Module.course_id == course_id))
    module = result.scalar_one_or_none()
    if module is None:
        raise NotFoundError("Modulo no encontrado en este curso")
    return module


async def _verify_lesson_in_module(lesson_id: str, module_id: str, db: AsyncSession) -> Lesson:
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id, Lesson.module_id == module_id))
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise NotFoundError("Leccion no encontrada en este modulo")
    return lesson


def _module_to_dict(module: Module) -> dict:
    return {
        "id": module.id,
        "courseId": module.course_id,
        "order": module.order,
        "title": module.title,
        "description": module.description or "",
        "duration": module.duration or 0,
        "isPublished": module.is_published,
        "lessons": [],
        "quizzes": [],
        "labs": [],
    }


@router.post("/{course_id}/modules")
async def create_module(
    course_id: str,
    body: ModuleCreate,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    svc = ModuleService(db)
    module = await svc.create(course_id, body.model_dump(exclude_none=True, by_alias=False))
    return {"success": True, "data": _module_to_dict(module)}


@router.put("/{course_id}/modules/reorder")
async def reorder_modules(
    course_id: str,
    body: ModuleReorderRequest,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    svc = ModuleService(db)
    modules = await svc.reorder(course_id, body.module_ids)
    data = [_module_to_dict(m) for m in modules]
    return {"success": True, "data": data}


@router.put("/{course_id}/modules/{module_id}")
async def update_module(
    course_id: str,
    module_id: str,
    body: ModuleUpdate,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    await _verify_module_in_course(module_id, course_id, db)
    svc = ModuleService(db)
    module = await svc.update(module_id, body.model_dump(exclude_none=True, by_alias=False))
    return {"success": True, "data": _module_to_dict(module)}


@router.delete("/{course_id}/modules/{module_id}")
async def delete_module(
    course_id: str,
    module_id: str,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    await _verify_module_in_course(module_id, course_id, db)
    svc = ModuleService(db)
    await svc.delete(module_id)
    return {"success": True, "data": {"message": "Modulo eliminado"}}


@router.post("/{course_id}/modules/{module_id}/lessons")
async def create_lesson(
    course_id: str,
    module_id: str,
    body: LessonCreate,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    await _verify_module_in_course(module_id, course_id, db)
    svc = LessonService(db)
    lesson = await svc.create(module_id, body.model_dump(exclude_none=True, by_alias=False))
    return {"success": True, "data": {
        "id": lesson.id, "moduleId": lesson.module_id, "order": lesson.order,
        "title": lesson.title, "content": lesson.content or "", "type": lesson.type or "TEXT",
        "estimatedTime": lesson.estimated_time or 0,
    }}


@router.put("/{course_id}/modules/{module_id}/lessons/reorder")
async def reorder_lessons(
    course_id: str,
    module_id: str,
    body: LessonReorderRequest,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    await _verify_module_in_course(module_id, course_id, db)
    svc = LessonService(db)
    lessons = await svc.reorder(module_id, body.lesson_ids)
    data = [{"id": ls.id, "moduleId": ls.module_id, "order": ls.order, "title": ls.title} for ls in lessons]
    return {"success": True, "data": data}


@router.put("/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def update_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    body: LessonUpdate,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    await _verify_module_in_course(module_id, course_id, db)
    await _verify_lesson_in_module(lesson_id, module_id, db)
    svc = LessonService(db)
    lesson = await svc.update(lesson_id, body.model_dump(exclude_none=True, by_alias=False))
    return {"success": True, "data": {
        "id": lesson.id, "moduleId": lesson.module_id, "order": lesson.order,
        "title": lesson.title, "content": lesson.content or "", "type": lesson.type or "TEXT",
        "estimatedTime": lesson.estimated_time or 0,
    }}


@router.delete("/{course_id}/modules/{module_id}/lessons/{lesson_id}")
async def delete_lesson(
    course_id: str,
    module_id: str,
    lesson_id: str,
    _user: User = Depends(require_instructor_only),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _verify_course_ownership(course_id, _user, db)
    await _verify_module_in_course(module_id, course_id, db)
    await _verify_lesson_in_module(lesson_id, module_id, db)
    svc = LessonService(db)
    await svc.delete(lesson_id)
    return {"success": True, "data": {"message": "Leccion eliminada"}}
