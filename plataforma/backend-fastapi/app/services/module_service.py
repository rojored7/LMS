import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import NotFoundError
from app.models.course import Course, Module

logger = structlog.get_logger()


class ModuleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, module_id: str, load_lessons: bool = False) -> Module:
        query = select(Module).where(Module.id == module_id)
        if load_lessons:
            query = query.options(selectinload(Module.lessons))
        result = await self.db.execute(query)
        module = result.scalar_one_or_none()
        if not module:
            raise NotFoundError("Modulo no encontrado")
        return module

    async def list_by_course(self, course_id: str) -> list[Module]:
        result = await self.db.execute(
            select(Module)
            .where(Module.course_id == course_id)
            .options(selectinload(Module.lessons))
            .order_by(Module.order)
        )
        return list(result.scalars().all())

    async def create(self, course_id: str, data: dict) -> Module:
        result = await self.db.execute(select(Course).where(Course.id == course_id))
        course = result.scalar_one_or_none()
        if not course:
            raise NotFoundError("Curso no encontrado")

        module = Module(course_id=course_id, **data)
        self.db.add(module)
        await self.db.flush()
        logger.info("module_created", module_id=module.id, course_id=course_id)
        return module

    async def update(self, module_id: str, data: dict) -> Module:
        module = await self.get_by_id(module_id)
        for key, value in data.items():
            if value is not None and hasattr(module, key):
                setattr(module, key, value)
        await self.db.flush()
        return module

    async def delete(self, module_id: str) -> None:
        module = await self.get_by_id(module_id)
        await self.db.delete(module)
        await self.db.flush()
        logger.info("module_deleted", module_id=module_id)

    async def reorder(self, course_id: str, module_ids: list[str]) -> list[Module]:
        modules = await self.list_by_course(course_id)
        module_map = {m.id: m for m in modules}
        for idx, mid in enumerate(module_ids):
            if mid in module_map:
                module_map[mid].order = idx
        await self.db.flush()
        return await self.list_by_course(course_id)
