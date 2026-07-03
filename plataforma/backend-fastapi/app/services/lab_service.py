from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
            select(Lab).where(Lab.module_id == module_id)
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

    async def _attempt_count(self, lab_id: str, user_id: str) -> int:
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(LabSubmission).where(
                LabSubmission.lab_id == lab_id, LabSubmission.user_id == user_id
            )
        )
        return (result.scalar() or 0) + 1

    async def submit_executable(
        self,
        lab_id: str,
        user_id: str,
        code: str,
        language: str,
        passed: bool,
        stdout: str = "",
        stderr: str = "",
        exit_code: int = 0,
        execution_time: int = 0,
    ) -> LabSubmission:
        lab = await self.get_by_id(lab_id)
        attempts = await self._attempt_count(lab_id, user_id)
        submission = LabSubmission(
            user_id=user_id,
            lab_id=lab_id,
            code=code,
            language=language,
            passed=passed,
            stdout=stdout or "",
            stderr=stderr or "",
            exit_code=exit_code,
            execution_time=execution_time,
            attempts=attempts,
        )
        self.db.add(submission)
        await self.db.flush()

        if passed:
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            await ps.mark_lab_complete(user_id, lab.module_id)

        logger.info("lab_submitted_executable", lab_id=lab_id, user_id=user_id, passed=passed)
        return submission

    async def submit_deliverable(
        self,
        lab_id: str,
        user_id: str,
        response_text: str,
        language: str = "none",
    ) -> LabSubmission:
        attempts = await self._attempt_count(lab_id, user_id)
        submission = LabSubmission(
            user_id=user_id,
            lab_id=lab_id,
            code="",
            language=language,
            passed=None,
            response_text=response_text,
            attempts=attempts,
        )
        self.db.add(submission)
        await self.db.flush()
        logger.info("lab_submitted_deliverable", lab_id=lab_id, user_id=user_id)
        return submission

    async def grade_submission(
        self,
        submission_id: str,
        grader_id: str,
        passed: bool,
        feedback: str | None = None,
        score: int | None = None,
    ) -> LabSubmission:
        result = await self.db.execute(
            select(LabSubmission).where(LabSubmission.id == submission_id)
        )
        submission = result.scalar_one_or_none()
        if not submission:
            raise NotFoundError("Submission no encontrada")

        submission.passed = passed
        submission.feedback = feedback
        submission.score = score
        submission.graded_by = grader_id
        submission.graded_at = datetime.now(timezone.utc)
        await self.db.flush()

        if passed:
            lab = await self.get_by_id(submission.lab_id)
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            await ps.mark_lab_complete(submission.user_id, lab.module_id)

        logger.info("lab_submission_graded", submission_id=submission_id, passed=passed)
        return submission

    async def get_submissions(self, lab_id: str, user_id: str | None = None) -> list[LabSubmission]:
        query = select(LabSubmission).where(LabSubmission.lab_id == lab_id)
        if user_id:
            query = query.where(LabSubmission.user_id == user_id)
        query = query.order_by(LabSubmission.submitted_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    # Kept for backwards compatibility with manual complete flow
    async def submit(
        self,
        lab_id: str,
        user_id: str,
        code: str,
        language: str = "python",
        passed: bool = False,
        stdout: str = "",
        stderr: str = "",
        exit_code: int = 0,
        execution_time: int = 0,
    ) -> LabSubmission:
        return await self.submit_executable(
            lab_id=lab_id,
            user_id=user_id,
            code=code,
            language=language,
            passed=passed,
            stdout=stdout,
            stderr=stderr,
            exit_code=exit_code,
            execution_time=execution_time,
        )
