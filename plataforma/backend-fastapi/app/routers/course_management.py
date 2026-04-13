import io
import json
import zipfile

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.course_service import CourseService
from app.services.module_service import ModuleService
from app.services.lesson_service import LessonService

router = APIRouter(prefix="/api/course-management", tags=["course-management"])


def _parse_course_zip(zip_bytes: bytes) -> dict:
    """Parse a course ZIP file and extract course structure."""
    course_data = {"modules": []}
    with zipfile.ZipFile(io.BytesIO(zip_bytes), "r") as zf:
        names = sorted(zf.namelist())

        manifest_candidates = [n for n in names if n.endswith("course.json") or n.endswith("manifest.json")]
        if manifest_candidates:
            with zf.open(manifest_candidates[0]) as f:
                manifest = json.loads(f.read().decode("utf-8"))
                course_data.update(manifest)

        md_files = [n for n in names if n.endswith(".md")]
        module_map: dict[str, dict] = {}
        for md_path in md_files:
            parts = md_path.strip("/").split("/")
            if len(parts) >= 2:
                module_name = parts[-2] if len(parts) >= 2 else "default"
                if module_name not in module_map:
                    module_map[module_name] = {"title": module_name, "lessons": []}
                with zf.open(md_path) as f:
                    content = f.read().decode("utf-8")
                    lesson_title = parts[-1].replace(".md", "").replace("-", " ").replace("_", " ").title()
                    module_map[module_name]["lessons"].append({
                        "title": lesson_title,
                        "content": content,
                        "type": "TEXT",
                    })

        for idx, (name, mod_data) in enumerate(module_map.items()):
            mod_data["order"] = idx
            course_data["modules"].append(mod_data)

    return course_data


@router.post("/import-zip")
async def import_course_from_zip(
    file: UploadFile = File(...),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if not file.filename or not file.filename.endswith(".zip"):
        return ApiResponse(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": "El archivo debe ser un ZIP"},
        ).model_dump()

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        return ApiResponse(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": "El archivo no debe superar 50MB"},
        ).model_dump()

    try:
        course_data = _parse_course_zip(content)
    except Exception as e:
        return ApiResponse(
            success=False,
            error={"code": "PARSE_ERROR", "message": f"Error al parsear el ZIP: {str(e)}"},
        ).model_dump()

    course_service = CourseService(db)
    module_service = ModuleService(db)
    lesson_service = LessonService(db)

    title = course_data.get("title", file.filename.replace(".zip", ""))
    slug = course_data.get("slug", title.lower().replace(" ", "-"))
    description = course_data.get("description", f"Curso importado desde {file.filename}")

    course = await course_service.create({
        "title": title,
        "slug": slug,
        "description": description,
        "instructor_id": user.id,
    })

    modules_created = 0
    lessons_created = 0

    for mod_data in course_data.get("modules", []):
        module = await module_service.create(course.id, {
            "title": mod_data["title"],
            "order": mod_data.get("order", 0),
            "description": mod_data.get("description"),
        })
        modules_created += 1

        for idx, lesson_data in enumerate(mod_data.get("lessons", [])):
            await lesson_service.create(module.id, {
                "title": lesson_data["title"],
                "content": lesson_data.get("content", ""),
                "type": lesson_data.get("type", "TEXT"),
                "order": idx,
            })
            lessons_created += 1

    return ApiResponse(
        success=True,
        data={
            "courseId": course.id,
            "title": course.title,
            "modulesCreated": modules_created,
            "lessonsCreated": lessons_created,
        },
    ).model_dump()


@router.post("/validate-zip")
async def validate_course_zip(
    file: UploadFile = File(...),
    user: User = Depends(require_admin),
):
    if not file.filename or not file.filename.endswith(".zip"):
        return ApiResponse(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": "El archivo debe ser un ZIP"},
        ).model_dump()

    content = await file.read()
    try:
        course_data = _parse_course_zip(content)
        total_modules = len(course_data.get("modules", []))
        total_lessons = sum(len(m.get("lessons", [])) for m in course_data.get("modules", []))

        return ApiResponse(
            success=True,
            data={
                "valid": True,
                "title": course_data.get("title", "Sin titulo"),
                "modulesFound": total_modules,
                "lessonsFound": total_lessons,
                "modules": [
                    {
                        "title": m["title"],
                        "lessonCount": len(m.get("lessons", [])),
                    }
                    for m in course_data.get("modules", [])
                ],
            },
        ).model_dump()
    except Exception as e:
        return ApiResponse(
            success=False,
            error={"code": "PARSE_ERROR", "message": f"ZIP invalido: {str(e)}"},
        ).model_dump()
