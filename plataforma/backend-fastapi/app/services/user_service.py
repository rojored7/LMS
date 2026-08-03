from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.middleware.error_handler import AuthorizationError, NotFoundError
from app.models.user import Area, User, UserRole
from app.utils.security import hash_password, verify_password
from app.utils.query_utils import escape_like

logger = structlog.get_logger()


class UserService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_all_users(self, page: int = 1, limit: int = 20, role: str | None = None, search: str | None = None, area_id: str | None = None) -> tuple[list[User], int]:
        query = select(User).options(selectinload(User.area))
        count_query = select(func.count()).select_from(User)

        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)
        if search:
            safe_search = escape_like(search)
            filter_cond = User.name.ilike(f"%{safe_search}%", escape="\\") | User.email.ilike(f"%{safe_search}%", escape="\\")
            query = query.where(filter_cond)
            count_query = count_query.where(filter_cond)
        if area_id:
            query = query.where(User.area_id == area_id)
            count_query = count_query.where(User.area_id == area_id)

        total = (await self.db.execute(count_query)).scalar() or 0
        offset = (page - 1) * limit
        result = await self.db.execute(query.offset(offset).limit(limit).order_by(User.created_at.desc()))
        return list(result.scalars().all()), total

    async def get_user_by_id(self, user_id: str) -> User:
        result = await self.db.execute(
            select(User).options(selectinload(User.area)).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise NotFoundError("Usuario no encontrado")
        return user

    async def assign_user_area(self, user_id: str, area_id: str | None) -> User:
        user = await self.get_user_by_id(user_id)
        if area_id is not None:
            area_result = await self.db.execute(select(Area).where(Area.id == area_id))
            if area_result.scalar_one_or_none() is None:
                raise NotFoundError(f"Area '{area_id}' no encontrada")
        user.area_id = area_id
        await self.db.commit()
        await self.db.refresh(user, ["area"])
        return user

    async def assign_user_training_profile(self, user_id: str, profile_id: str | None) -> User:
        from app.models.user import TrainingProfile
        user = await self.get_user_by_id(user_id)
        if profile_id is not None:
            profile_result = await self.db.execute(select(TrainingProfile).where(TrainingProfile.id == profile_id))
            if profile_result.scalar_one_or_none() is None:
                raise NotFoundError(f"Perfil '{profile_id}' no encontrado")
        user.training_profile_id = profile_id
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_profile(self, user_id: str, **kwargs: object) -> User:
        user = await self.get_user_by_id(user_id)
        for key, value in kwargs.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def update_user_role(self, user_id: str, new_role: str, admin_role: object) -> User:
        user = await self.get_user_by_id(user_id)
        user.role = UserRole(new_role)
        await self.db.flush()
        await self.db.refresh(user)
        logger.info("user_role_changed", user_id=user_id, new_role=new_role)
        return user

    async def change_password(self, user_id: str, current_password: str, new_password: str, token_service=None) -> None:
        user = await self.get_user_by_id(user_id)
        if not verify_password(current_password, user.password_hash):
            raise AuthorizationError("Contrasena actual incorrecta")
        user.password_hash = hash_password(new_password)
        await self.db.flush()
        if token_service:
            await token_service.invalidate_all_user_tokens(user_id)
        logger.info("password_changed", user_id=user_id)

    async def delete_user(self, user_id: str) -> None:
        user = await self.get_user_by_id(user_id)
        await self.db.delete(user)
        await self.db.flush()
        logger.info("user_deleted", user_id=user_id)
