import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import NotFoundError, ValidationError
from app.models.assessment import Project, ProjectStatus, ProjectSubmission

logger = structlog.get_logger()


class ProjectService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, project_id: str) -> Project:
        result = await self.db.execute(select(Project).where(Project.id == project_id))
        project = result.scalar_one_or_none()
        if not project:
            raise NotFoundError("Proyecto no encontrado")
        return project

    async def list_by_module(self, module_id: str) -> list[Project]:
        result = await self.db.execute(
            select(Project).where(Project.module_id == module_id).order_by(Project.created_at)
        )
        return list(result.scalars().all())

    async def create(self, module_id: str, data: dict) -> Project:
        project = Project(module_id=module_id, **data)
        self.db.add(project)
        await self.db.flush()
        logger.info("project_created", project_id=project.id, module_id=module_id)
        return project

    async def update(self, project_id: str, data: dict) -> Project:
        project = await self.get_by_id(project_id)
        for key, value in data.items():
            if value is not None and hasattr(project, key):
                setattr(project, key, value)
        await self.db.flush()
        return project

    async def delete(self, project_id: str) -> None:
        project = await self.get_by_id(project_id)
        await self.db.delete(project)
        await self.db.flush()
        logger.info("project_deleted", project_id=project_id)

    async def submit(self, project_id: str, user_id: str, content: str | None = None, file_url: str | None = None) -> ProjectSubmission:
        await self.get_by_id(project_id)
        submission = ProjectSubmission(
            user_id=user_id,
            project_id=project_id,
            content=content,
            file_url=file_url,
            status=ProjectStatus.PENDING,
        )
        self.db.add(submission)
        await self.db.flush()
        logger.info("project_submitted", project_id=project_id, user_id=user_id)
        return submission

    async def get_submission(self, submission_id: str) -> ProjectSubmission:
        result = await self.db.execute(select(ProjectSubmission).where(ProjectSubmission.id == submission_id))
        sub = result.scalar_one_or_none()
        if not sub:
            raise NotFoundError("Entrega no encontrada")
        return sub

    async def list_submissions(self, project_id: str | None = None, user_id: str | None = None, status: str | None = None) -> list[ProjectSubmission]:
        query = select(ProjectSubmission)
        if project_id:
            query = query.where(ProjectSubmission.project_id == project_id)
        if user_id:
            query = query.where(ProjectSubmission.user_id == user_id)
        if status:
            query = query.where(ProjectSubmission.status == ProjectStatus(status))
        query = query.order_by(ProjectSubmission.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def review_submission(self, submission_id: str, reviewer_id: str, status: str, score: float | None = None, feedback: str | None = None) -> ProjectSubmission:
        sub = await self.get_submission(submission_id)
        if sub.status not in (ProjectStatus.PENDING, ProjectStatus.REVIEWING):
            raise ValidationError("Esta entrega ya fue revisada")

        sub.status = ProjectStatus(status)
        sub.reviewer_id = reviewer_id
        sub.score = score
        sub.feedback = feedback
        await self.db.flush()

        if sub.status == ProjectStatus.APPROVED:
            project = await self.get_by_id(sub.project_id)
            from app.services.progress_service import ProgressService
            ps = ProgressService(self.db)
            await ps.update_project_status(sub.user_id, project.module_id, "APPROVED")

        logger.info("submission_reviewed", submission_id=submission_id, status=status)
        return sub
