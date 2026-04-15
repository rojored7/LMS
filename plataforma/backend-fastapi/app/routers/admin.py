import enum
import math

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User, UserRole
from app.schemas.admin import AdminEnrollmentResponse, AdminUserWithEnrollments
from app.schemas.common import ApiResponse, PaginationMeta
from app.schemas.user import UserResponse
from app.services.admin_service import AdminService
from app.services.course_service import CourseService
from app.services.user_service import UserService

router = APIRouter(prefix="/api/admin", tags=["admin"])


logger = structlog.get_logger()


class RoleUpdateRequest(BaseModel):
    role: UserRole


class BulkRoleRequest(BaseModel):
    user_ids: list[str]
    role: UserRole


class AssignCourseRequest(BaseModel):
    userId: str = Field(min_length=1, max_length=36)
    courseId: str = Field(min_length=1, max_length=36)


def _serialize_user(user: User) -> dict:
    return UserResponse.model_validate(user).model_dump()


@router.get("/dashboard")
async def get_dashboard_stats(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    stats = await service.get_dashboard_stats()
    return ApiResponse(success=True, data=stats).model_dump()


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = None,
    role: str | None = None,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    users_list, total = await service.get_all_users(page=page, limit=limit, role=role, search=search)
    users = [_serialize_user(u) for u in users_list]
    pages = math.ceil(total / limit) if limit > 0 else 1
    return ApiResponse(
        success=True,
        data=users,
        meta=PaginationMeta(total=total, page=page, limit=limit, pages=pages),
    ).model_dump()


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    return ApiResponse(success=True, data=_serialize_user(user)).model_dump()


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    body: RoleUpdateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    updated = await service.update_user_role(user_id, body.role.value, admin.role)
    logger.info("admin_role_updated", target_user_id=user_id, new_role=body.role.value, admin_id=admin.id)
    return ApiResponse(success=True, data=_serialize_user(updated)).model_dump()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.id:
        return ApiResponse(
            success=False,
            error={"code": "FORBIDDEN", "message": "No puedes eliminar tu propia cuenta"},
        ).model_dump()
    service = UserService(db)
    await service.delete_user(user_id)
    logger.info("admin_user_deleted", target_user_id=user_id, admin_id=admin.id)
    return ApiResponse(success=True, data={"message": "Usuario eliminado"}).model_dump()


@router.post("/users/bulk-role")
async def bulk_update_role(
    body: BulkRoleRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    count = await service.bulk_update_role(body.user_ids, body.role.value)
    logger.info("admin_bulk_role_updated", count=count, new_role=body.role.value, admin_id=admin.id)
    return ApiResponse(success=True, data={"updated": count}).model_dump()


@router.get("/enrollments/recent")
async def get_recent_enrollments(
    limit: int = Query(10, ge=1, le=50),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AdminService(db)
    enrollments = await service.get_recent_enrollments(limit=limit)
    return ApiResponse(success=True, data=enrollments).model_dump()


@router.get("/users/{user_id}/enrollments")
async def get_user_enrollments(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    course_service = CourseService(db)
    enrollments = await course_service.get_user_enrollments(user_id)
    enrollment_data = [AdminEnrollmentResponse.model_validate(e).model_dump() for e in enrollments]
    data = AdminUserWithEnrollments(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role.value if isinstance(user.role, enum.Enum) else str(user.role),
        avatar=user.avatar,
        created_at=user.created_at,
        enrollments=enrollment_data,
    ).model_dump()
    return ApiResponse(success=True, data=data).model_dump()


@router.post("/enrollments")
async def assign_course_to_user(
    body: AssignCourseRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    course_service = CourseService(db)
    enrollment, created = await course_service.enroll_user(body.userId, body.courseId)
    data = AdminEnrollmentResponse.model_validate(enrollment).model_dump()
    return ApiResponse(success=True, data={"enrollment": data}).model_dump()


@router.delete("/enrollments/{enrollment_id}")
async def remove_enrollment(
    enrollment_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    course_service = CourseService(db)
    await course_service.delete_enrollment_by_id(enrollment_id)
    return ApiResponse(success=True, data={"message": "Inscripcion eliminada"}).model_dump()
