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
    starter_code: str | None = None
    solution: str | None = None
    tests: dict | None = None
    hints: list[str] | None = None
    language: str = "python"


class LabUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    starter_code: str | None = None
    solution: str | None = None
    tests: dict | None = None
    hints: list[str] | None = None
    language: str | None = None


class SubmitCodeRequest(BaseModel):
    code: str


class LabResponse(CamelModel):
    id: str
    title: str
    description: str | None = None
    language: str = "python"
    starter_code: str | None = None
    solution: str | None = None
    tests: dict | list | None = None
    hints: list[str] | None = None
    module_id: str


class SubmissionResponse(CamelModel):
    id: str
    user_id: str
    lab_id: str
    code: str
    language: str = "python"
    passed: bool
    stdout: str | None = None
    stderr: str | None = None
    exit_code: int = 0
    execution_time: int = 0


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
    )

    passed = exec_result.get("success", False)
    stdout = exec_result.get("stdout", "")
    stderr = exec_result.get("stderr", "")
    exit_code = exec_result.get("exitCode", 0)
    execution_time = exec_result.get("executionTime", 0)

    submission = await lab_service.submit(
        lab_id=lab_id,
        user_id=user.id,
        code=body.code,
        language=lab.language,
        passed=passed,
        stdout=stdout,
        stderr=stderr,
        exit_code=exit_code,
        execution_time=execution_time,
    )

    return ApiResponse(
        success=True,
        data={
            "submissionId": submission.id,
            "passed": submission.passed,
            "stdout": submission.stdout,
            "stderr": submission.stderr,
            "exitCode": submission.exit_code,
            "executionTime": submission.execution_time,
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
