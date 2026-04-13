import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.common import PaginationMeta
from app.schemas.user import ChangePasswordRequest, UserProfileUpdate, UserResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=500),
    role: str | None = None,
    search: str | None = None,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = UserService(db)
    users, total = await service.get_all_users(page, limit, role, search)
    return {
        "success": True,
        "data": [UserResponse.model_validate(u).model_dump() for u in users],
        "meta": PaginationMeta(total=total, page=page, limit=limit, pages=math.ceil(total / limit) if limit else 0),
    }


@router.get("/me")
async def get_my_profile(user: User = Depends(get_current_user)) -> dict:
    return {"success": True, "data": UserResponse.model_validate(user).model_dump()}


@router.put("/me")
async def update_my_profile(
    data: UserProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = UserService(db)
    updated = await service.update_profile(user.id, **data.model_dump(exclude_unset=True))
    return {"success": True, "data": UserResponse.model_validate(updated).model_dump()}


@router.post("/me/change-password")
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.middleware.auth import get_token_service
    token_service = get_token_service()
    service = UserService(db)
    await service.change_password(user.id, data.current_password, data.new_password, token_service)
    return {"success": True, "data": {"message": "Contrasena actualizada"}}


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    from app.middleware.error_handler import AuthorizationError
    from app.models.user import UserRole
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise AuthorizationError("No autorizado para ver este perfil")
    service = UserService(db)
    found = await service.get_user_by_id(user_id)
    return {"success": True, "data": UserResponse.model_validate(found).model_dump()}


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    _user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    service = UserService(db)
    await service.delete_user(user_id)
    return {"success": True, "data": {"message": "Usuario eliminado"}}
