from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_instructor
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.project_service import ProjectService

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    requirements: str | None = None
    rubric: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    rubric: str | None = None


class SubmitProjectRequest(BaseModel):
    content: str | None = None
    file_url: str | None = None


class ReviewRequest(BaseModel):
    status: str
    score: float | None = None
    feedback: str | None = None


@router.get("/module/{module_id}")
async def list_projects(
    module_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    projects = await service.list_by_module(module_id)
    data = [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "requirements": p.requirements,
            "rubric": p.rubric,
            "moduleId": p.module_id,
        }
        for p in projects
    ]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    project = await service.get_by_id(project_id)
    return ApiResponse(
        success=True,
        data={
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "requirements": project.requirements,
            "rubric": project.rubric,
            "moduleId": project.module_id,
        },
    ).model_dump()


@router.post("/module/{module_id}")
async def create_project(
    module_id: str,
    body: ProjectCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    project = await service.create(module_id, body.model_dump())
    return ApiResponse(success=True, data={"id": project.id, "title": project.title}).model_dump()


@router.put("/{project_id}")
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    project = await service.update(project_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data={"id": project.id, "title": project.title}).model_dump()


@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    await service.delete(project_id)
    return ApiResponse(success=True, data={"message": "Proyecto eliminado"}).model_dump()


@router.post("/{project_id}/submit")
async def submit_project(
    project_id: str,
    body: SubmitProjectRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    submission = await service.submit(project_id, user.id, content=body.content, file_url=body.file_url)
    return ApiResponse(
        success=True,
        data={
            "id": submission.id,
            "status": submission.status.value,
            "createdAt": submission.created_at.isoformat(),
        },
    ).model_dump()


@router.get("/submissions/list")
async def list_submissions(
    project_id: str | None = None,
    status: str | None = None,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    submissions = await service.list_submissions(project_id=project_id, status=status)
    data = [
        {
            "id": s.id,
            "userId": s.user_id,
            "projectId": s.project_id,
            "status": s.status.value,
            "score": s.score,
            "feedback": s.feedback,
            "createdAt": s.created_at.isoformat(),
        }
        for s in submissions
    ]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/submissions/mine")
async def get_my_submissions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    submissions = await service.list_submissions(user_id=user.id)
    data = [
        {
            "id": s.id,
            "projectId": s.project_id,
            "status": s.status.value,
            "score": s.score,
            "feedback": s.feedback,
            "createdAt": s.created_at.isoformat(),
        }
        for s in submissions
    ]
    return ApiResponse(success=True, data=data).model_dump()


@router.put("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: str,
    body: ReviewRequest,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = ProjectService(db)
    sub = await service.review_submission(
        submission_id, user.id, body.status, score=body.score, feedback=body.feedback
    )
    return ApiResponse(
        success=True,
        data={
            "id": sub.id,
            "status": sub.status.value,
            "score": sub.score,
            "feedback": sub.feedback,
        },
    ).model_dump()
