import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.user import User

logger = structlog.get_logger()


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: str) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("Usuario no encontrado")
        return user

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def list_users(self, page: int = 1, limit: int = 20, search: str | None = None, role: str | None = None) -> dict:
        query = select(User)
        count_query = select(func.count()).select_from(User)

        if search:
            pattern = f"%{search}%"
            query = query.where((User.name.ilike(pattern)) | (User.email.ilike(pattern)))
            count_query = count_query.where((User.name.ilike(pattern)) | (User.email.ilike(pattern)))

        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        offset = (page - 1) * limit
        query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(query)
        users = list(result.scalars().all())

        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit if total else 0,
        }

    async def update_profile(self, user: User, data: dict) -> User:
        for key, value in data.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        return user

    async def update_user(self, user_id: str, data: dict) -> User:
        user = await self.get_by_id(user_id)
        if "email" in data and data["email"] and data["email"] != user.email:
            existing = await self.get_by_email(data["email"])
            if existing:
                raise ConflictError("El email ya esta en uso")
        for key, value in data.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        return user

    async def delete_user(self, user_id: str) -> None:
        user = await self.get_by_id(user_id)
        await self.db.delete(user)
        await self.db.flush()
        logger.info("user_deleted", user_id=user_id)

    async def add_xp(self, user: User, xp_amount: int) -> User:
        user.xp = user.xp + xp_amount
        await self.db.flush()
        return user
