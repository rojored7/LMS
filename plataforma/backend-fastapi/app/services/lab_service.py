import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.middleware.error_handler import NotFoundError
from app.models.assessment import Lab, LabSubmission

logger = structlog.get_logger()


class LabService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, lab_id: str) -> Lab:
        result = await self.db.execute(select(Lab).where(Lab.id == lab_id))
        lab = result.scalar_one_or_none()
        if not lab:
            raise NotFoundError("Laboratorio no encontrado")
        return lab

    async def list_by_module(self, module_id: str) -> list[Lab]:
        result = await self.db.execute(
            select(Lab).where(Lab.module_id == module_id).order_by(Lab.created_at)
        )
        return list(result.scalars().all())

    async def create(self, module_id: str, data: dict) -> Lab:
        lab = Lab(module_id=module_id, **data)
        self.db.add(lab)
        await self.db.flush()
        logger.info("lab_created", lab_id=lab.id, module_id=module_id)
        return lab

    async def update(self, lab_id: str, data: dict) -> Lab:
        lab = await self.get_by_id(lab_id)
        for key, value in data.items():
            if value is not None and hasattr(lab, key):
                setattr(lab, key, value)
        await self.db.flush()
        return lab

    async def delete(self, lab_id: str) -> None:
        lab = await self.get_by_id(lab_id)
        await self.db.delete(lab)
        await self.db.flush()
        logger.info("lab_deleted", lab_id=lab_id)

    async def submit(self, lab_id: str, user_id: str, code: str, output: str | None, passed: bool, execution_time_ms: int | None = None) -> LabSubmission:
        lab = await self.get_by_id(lab_id)
        submission = LabSubmission(
            user_id=user_id,
            lab_id=lab_id,
            code=code,
            output=output,
            passed=passed,
            execution_time_ms=execution_time_ms,
        )
        self.db.add(submission)
        await self.db.flush()

        if passed:
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            await ps.mark_lab_complete(user_id, lab.module_id)

        logger.info("lab_submitted", lab_id=lab_id, user_id=user_id, passed=passed)
        return submission

    async def get_submissions(self, lab_id: str, user_id: str | None = None) -> list[LabSubmission]:
        query = select(LabSubmission).where(LabSubmission.lab_id == lab_id)
        if user_id:
            query = query.where(LabSubmission.user_id == user_id)
        query = query.order_by(LabSubmission.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())
