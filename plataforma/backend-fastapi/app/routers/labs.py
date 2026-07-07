from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user, require_instructor, verify_module_ownership
from app.middleware.error_handler import NotFoundError
from app.middleware.rate_limit import limiter
from app.models.assessment import Lab, LabSubmission
from app.models.course import Module
from app.models.user import User, UserRole
from app.schemas.common import ApiResponse
from app.schemas.lab import (
    GradeSubmissionRequest,
    LabCreate,
    LabResponse,
    LabResponseStudent,
    LabUpdate,
    SubmissionResponse,
    SubmitCodeRequest,
    SubmitDeliverableRequest,
)
from app.services.lab_service import LabService
from app.utils.enrollment_check import verify_enrollment_or_staff

router = APIRouter(prefix="/api/labs", tags=["labs"])


@router.get("/executor/health")
async def executor_health(
    _user: User = Depends(get_current_user),
):
    from app.services.executor_client import executor_client
    healthy = await executor_client.health_check()
    return ApiResponse(success=True, data={"executorAvailable": healthy}).model_dump()


@router.get("/module/{module_id}")
async def list_labs(
    module_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mod = (await db.execute(select(Module).where(Module.id == module_id))).scalar_one_or_none()
    if mod is None:
        raise HTTPException(status_code=404, detail="Modulo no encontrado")
    await verify_enrollment_or_staff(db, user.id, mod.course_id, user.role)
    service = LabService(db)
    labs = await service.list_by_module(module_id)
    schema = LabResponse if user.role in (UserRole.ADMIN, UserRole.INSTRUCTOR) else LabResponseStudent
    data = [schema.model_validate(lab).model_dump() for lab in labs]
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/{lab_id}")
async def get_lab(
    lab_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    lab = await service.get_by_id(lab_id)
    mod = (await db.execute(select(Module).where(Module.id == lab.module_id))).scalar_one_or_none()
    if mod is None:
        raise HTTPException(status_code=404, detail="Modulo no encontrado")
    await verify_enrollment_or_staff(db, user.id, mod.course_id, user.role)
    schema = LabResponse if user.role in (UserRole.ADMIN, UserRole.INSTRUCTOR) else LabResponseStudent
    return ApiResponse(success=True, data=schema.model_validate(lab).model_dump()).model_dump()


@router.post("/module/{module_id}")
async def create_lab(
    module_id: str,
    body: LabCreate,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    await verify_module_ownership(module_id, user, db)
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
    lab_row = (await db.execute(select(Lab).where(Lab.id == lab_id))).scalar_one_or_none()
    if lab_row is None:
        raise NotFoundError("Laboratorio no encontrado")
    await verify_module_ownership(lab_row.module_id, user, db)
    service = LabService(db)
    lab = await service.update(lab_id, body.model_dump(exclude_unset=True))
    return ApiResponse(success=True, data=LabResponse.model_validate(lab).model_dump()).model_dump()


@router.delete("/{lab_id}")
async def delete_lab(
    lab_id: str,
    user: User = Depends(require_instructor),
    db: AsyncSession = Depends(get_db),
):
    lab_row = (await db.execute(select(Lab).where(Lab.id == lab_id))).scalar_one_or_none()
    if lab_row is None:
        raise NotFoundError("Laboratorio no encontrado")
    await verify_module_ownership(lab_row.module_id, user, db)
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
    if len(body.code) > 50_000:
        raise HTTPException(status_code=400, detail="Codigo excede el limite de 50KB")

    lab_service = LabService(db)
    lab = await lab_service.get_by_id(lab_id)
    mod = (await db.execute(select(Module).where(Module.id == lab.module_id))).scalar_one_or_none()
    if mod is None:
        raise HTTPException(status_code=404, detail="Modulo no encontrado")
    await verify_enrollment_or_staff(db, user.id, mod.course_id, user.role)

    if lab.lab_type == "DELIVERABLE":
        raise HTTPException(
            status_code=400,
            detail="Este lab es de entrega. Usa POST /labs/{lab_id}/submit-deliverable",
        )

    # Normalize tests: must be a list for the executor
    tests: list | None = None
    if lab.tests:
        if isinstance(lab.tests, list):
            tests = lab.tests
        elif isinstance(lab.tests, dict):
            tests = list(lab.tests.values()) if lab.tests else None

    from app.services.executor_client import executor_client
    exec_result = await executor_client.execute_code(
        code=body.code,
        language=lab.language,
        tests=tests,
    )

    if exec_result.get("executor_error"):
        return ApiResponse(
            success=False,
            data={
                "executorError": True,
                "error": exec_result.get("error", "Executor no disponible"),
            },
        ).model_dump()

    result_data = exec_result.get("result", exec_result)
    passed = result_data.get("passed", False)
    stdout = result_data.get("stdout", "")
    stderr = result_data.get("stderr", result_data.get("error", ""))
    exit_code = result_data.get("exitCode", 0)
    execution_time = result_data.get("executionTime", 0)

    submission = await lab_service.submit_executable(
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


@router.post("/{lab_id}/submit-deliverable")
@limiter.limit("5/minute")
async def submit_deliverable(
    request: Request,
    lab_id: str,
    body: SubmitDeliverableRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lab_service = LabService(db)
    lab = await lab_service.get_by_id(lab_id)

    if lab.lab_type != "DELIVERABLE":
        raise HTTPException(
            status_code=400,
            detail="Este lab es ejecutable. Usa POST /labs/{lab_id}/submit",
        )

    mod = (await db.execute(select(Module).where(Module.id == lab.module_id))).scalar_one_or_none()
    if mod is None:
        raise HTTPException(status_code=404, detail="Modulo no encontrado")
    await verify_enrollment_or_staff(db, user.id, mod.course_id, user.role)

    submission = await lab_service.submit_deliverable(
        lab_id=lab_id,
        user_id=user.id,
        response_text=body.response_text,
    )

    return ApiResponse(
        success=True,
        data={
            "submissionId": submission.id,
            "passed": None,
            "message": "Entrega enviada. El instructor revisara tu respuesta.",
        },
    ).model_dump()


@router.put("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    body: GradeSubmissionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user.role not in (UserRole.ADMIN, UserRole.INSTRUCTOR):
        raise HTTPException(status_code=403, detail="Solo instructores pueden calificar submissions")

    lab_service = LabService(db)
    submission = await lab_service.grade_submission(
        submission_id=submission_id,
        grader_id=user.id,
        passed=body.passed,
        feedback=body.feedback,
        score=body.score,
    )
    return ApiResponse(
        success=True,
        data=SubmissionResponse.model_validate(submission).model_dump(),
    ).model_dump()


@router.post("/{lab_id}/complete")
@limiter.limit("5/minute")
async def complete_lab_manual(
    request: Request,
    lab_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lab_service = LabService(db)
    lab = await lab_service.get_by_id(lab_id)

    if user.role == UserRole.STUDENT:
        raise HTTPException(
            status_code=403,
            detail="Solo instructores y admins pueden completar labs manualmente",
        )

    if lab.lab_type == "EXECUTABLE":
        raise HTTPException(
            status_code=400,
            detail="Los labs ejecutables se completan automaticamente al pasar todos los tests.",
        )

    mod = (await db.execute(select(Module).where(Module.id == lab.module_id))).scalar_one_or_none()
    if mod is None:
        raise HTTPException(status_code=404, detail="Modulo no encontrado")
    await verify_enrollment_or_staff(db, user.id, mod.course_id, user.role)

    existing = await lab_service.get_submissions(lab_id, user_id=user.id)
    if any(s.passed for s in existing):
        return ApiResponse(success=True, data={"passed": True, "message": "Lab ya completado"}).model_dump()

    submission = await lab_service.submit(
        lab_id=lab_id,
        user_id=user.id,
        code="# Completado manualmente",
        language=lab.language,
        passed=True,
        stdout="Marcado como completado manualmente",
        stderr="",
        exit_code=0,
        execution_time=0,
    )
    return ApiResponse(
        success=True,
        data={"submissionId": submission.id, "passed": True, "manual": True},
    ).model_dump()


@router.get("/{lab_id}/submissions")
async def get_submissions(
    lab_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = LabService(db)
    # Instructors/admins see all submissions; students only their own
    user_filter = user.id if user.role == UserRole.STUDENT else None
    submissions = await service.get_submissions(lab_id, user_id=user_filter)
    data = [SubmissionResponse.model_validate(s).model_dump() for s in submissions]
    return ApiResponse(success=True, data=data).model_dump()
