from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse, PaginationMeta
from app.schemas.user import UserResponse
from app.services.admin_service import AdminService
from app.services.user_service import UserService

router = APIRouter(prefix="/api/admin", tags=["admin"])


class BulkRoleRequest(BaseModel):
    user_ids: list[str]
    role: str


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
    limit: int = Query(20, ge=1, le=500),
    search: str | None = None,
    role: str | None = None,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    result = await service.list_users(page=page, limit=limit, search=search, role=role)
    users = [_serialize_user(u) for u in result["users"]]
    return ApiResponse(
        success=True,
        data=users,
        meta=PaginationMeta(total=result["total"], page=result["page"], limit=result["limit"], pages=result["pages"]),
    ).model_dump()


@router.get("/users/{user_id}")
async def get_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.get_by_id(user_id)
    return ApiResponse(success=True, data=_serialize_user(user)).model_dump()


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    body: dict,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    role = body.get("role")
    if role not in [r.value for r in UserRole]:
        return ApiResponse(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": f"Rol invalido. Valores validos: {[r.value for r in UserRole]}"},
        ).model_dump()

    service = UserService(db)
    updated = await service.update_user(user_id, {"role": UserRole(role)})
    return ApiResponse(success=True, data=_serialize_user(updated)).model_dump()


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.delete_user(user_id)
    await db.flush()
    return ApiResponse(success=True, data={"message": "Usuario eliminado"}).model_dump()


@router.post("/users/bulk-role")
async def bulk_update_role(
    body: BulkRoleRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if body.role not in [r.value for r in UserRole]:
        return ApiResponse(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": "Rol invalido"},
        ).model_dump()

    service = AdminService(db)
    count = await service.bulk_update_role(body.user_ids, body.role)
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
