from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import Area
from app.middleware.error_handler import ConflictError, NotFoundError


class AreaService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def list_areas(self) -> list[Area]:
        result = await self._db.execute(select(Area).order_by(Area.name))
        return list(result.scalars().all())

    async def create_area(self, name: str, description: str | None, color: str | None) -> Area:
        existing = await self._db.execute(select(Area).where(Area.name == name))
        if existing.scalar_one_or_none() is not None:
            raise ConflictError(f"Ya existe un area con el nombre '{name}'")
        area = Area(name=name, description=description, color=color)
        self._db.add(area)
        await self._db.commit()
        await self._db.refresh(area)
        return area

    async def update_area(self, area_id: str, name: str | None, description: str | None, color: str | None) -> Area:
        area = await self._get_or_404(area_id)
        if name is not None and name != area.name:
            existing = await self._db.execute(select(Area).where(Area.name == name))
            if existing.scalar_one_or_none() is not None:
                raise ConflictError(f"Ya existe un area con el nombre '{name}'")
            area.name = name
        if description is not None:
            area.description = description
        if color is not None:
            area.color = color
        await self._db.commit()
        await self._db.refresh(area)
        return area

    async def delete_area(self, area_id: str) -> None:
        area = await self._get_or_404(area_id)
        await self._db.delete(area)
        await self._db.commit()

    async def get_area_by_id(self, area_id: str) -> Area:
        return await self._get_or_404(area_id)

    async def _get_or_404(self, area_id: str) -> Area:
        result = await self._db.execute(select(Area).where(Area.id == area_id))
        area = result.scalar_one_or_none()
        if area is None:
            raise NotFoundError(f"Area '{area_id}' no encontrada")
        return area
