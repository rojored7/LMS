from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.common import ApiResponse, PaginationMeta
from app.schemas.user import AdminUserUpdateRequest, UserResponse, UserUpdateRequest
from app.services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
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
    users = [UserResponse.model_validate(u).model_dump() for u in result["users"]]
    return ApiResponse(
        success=True,
        data=users,
        meta=PaginationMeta(total=result["total"], page=result["page"], limit=result["limit"], pages=result["pages"]),
    ).model_dump()


@router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    return ApiResponse(success=True, data=UserResponse.model_validate(user).model_dump()).model_dump()


@router.put("/profile")
async def update_profile(
    body: UserUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    data = body.model_dump(exclude_unset=True)
    updated = await service.update_profile(user, data)
    return ApiResponse(success=True, data=UserResponse.model_validate(updated).model_dump()).model_dump()


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    user = await service.get_by_id(user_id)
    return ApiResponse(success=True, data=UserResponse.model_validate(user).model_dump()).model_dump()


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    body: AdminUserUpdateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    data = body.model_dump(exclude_unset=True)
    updated = await service.update_user(user_id, data)
    return ApiResponse(success=True, data=UserResponse.model_validate(updated).model_dump()).model_dump()


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = UserService(db)
    await service.delete_user(user_id)
    return ApiResponse(success=True, data={"message": "Usuario eliminado"}).model_dump()
