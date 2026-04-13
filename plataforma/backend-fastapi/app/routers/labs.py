from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_instructor
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.common import ApiResponse, CamelModel
from app.services.executor_client import ExecutorClient
from app.services.lab_service import LabService

router = APIRouter(prefix="/api/labs", tags=["labs"])


class LabCreate(BaseModel):
    title: str
    description: str | None = None
    instructions: str | None = None
    starter_code: str | None = None
    solution_code: str | None = None
    test_code: str | None = None
    language: str = "python"
    timeout_seconds: int = 30


class LabUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    instructions: str | None = None
    starter_code: str | None = None
    solution_code: str | None = None
    test_code: str | None = None
    language: str | None = None
    timeout_seconds: int | None = None


class SubmitCodeRequest(BaseModel):
    code: str


class LabResponse(CamelModel):
    id: str
    title: str
    description: str | None = None
    instructions: str | None = None
    starter_code: str | None = None
    language: str
    timeout_seconds: int
    module_id: str


class SubmissionResponse(CamelModel):
    id: str
    user_id: str
    lab_id: str
    code: str
    output: str | None = None
    passed: bool
    execution_time_ms: int | None = None


@router.get("/module/{module_id}")
async def list_labs(
    module_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    labs = await service.list_by_module(module_id)
    data = [LabResponse.model_validate(lab).model_dump() for lab in labs]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{lab_id}")
async def get_lab(
    lab_id: str,
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    lab = await service.get_by_id(lab_id)
    return ApiResponse(success=True, data=LabResponse.model_validate(lab).model_dump()).model_dump()


@router.post("/module/{module_id}")
async def create_lab(
    module_id: str,
    body: LabCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    lab = await service.create(module_id, body.model_dump())
    return ApiResponse(success=True, data=LabResponse.model_validate(lab).model_dump()).model_dump()


@router.put("/{lab_id}")
async def update_lab(
    lab_id: str,
    body: LabUpdate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    lab = await service.update(lab_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=LabResponse.model_validate(lab).model_dump()).model_dump()


@router.delete("/{lab_id}")
async def delete_lab(
    lab_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    await service.delete(lab_id)
    return ApiResponse(success=True, data={"message": "Laboratorio eliminado"}).model_dump()


@router.post("/{lab_id}/submit")
@limiter.limit("10/minute")
async def submit_lab(
    request: Request,
    lab_id: str,
    body: SubmitCodeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lab_service = LabService(db)
    lab = await lab_service.get_by_id(lab_id)

    executor = ExecutorClient()
    exec_result = await executor.execute_code(
        code=body.code,
        language=lab.language,
        test_code=lab.test_code,
        timeout=lab.timeout_seconds,
    )

    passed = exec_result.get("success", False)
    output = exec_result.get("stdout", "") or exec_result.get("stderr", "")
    execution_time = exec_result.get("executionTime")

    submission = await lab_service.submit(
        lab_id=lab_id,
        user_id=user.id,
        code=body.code,
        output=output,
        passed=passed,
        execution_time_ms=execution_time,
    )

    return ApiResponse(
        success=True,
        data={
            "submissionId": submission.id,
            "passed": submission.passed,
            "output": submission.output,
            "executionTimeMs": submission.execution_time_ms,
        },
    ).model_dump()


@router.get("/{lab_id}/submissions")
async def get_submissions(
    lab_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    submissions = await service.get_submissions(lab_id, user_id=user.id)
    data = [SubmissionResponse.model_validate(s).model_dump() for s in submissions]
    return ApiResponse(success=True, data=data).model_dump()
