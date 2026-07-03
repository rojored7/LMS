from datetime import datetime
from typing import Any

from pydantic import BaseModel, field_validator

from app.schemas.common import CamelModel


def _coerce_tests(v: Any) -> list | None:
    """Convert dict/empty-dict to list or None — handles legacy DB data."""
    if v is None:
        return None
    if isinstance(v, list):
        return v if v else None
    if isinstance(v, dict):
        # Legacy: {} means no tests, non-empty dict means wrap in list
        if not v:
            return None
        return list(v.values())
    return None


class LabCreate(BaseModel):
    title: str
    description: str | None = None
    lab_type: str = "EXECUTABLE"
    starter_code: str | None = None
    solution: str | None = None
    tests: list | None = None
    hints: list[str] | None = None
    language: str = "python"
    # DELIVERABLE fields
    response_instructions: str | None = None
    file_required: bool = False
    allowed_file_types: str | None = None


class LabUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    lab_type: str | None = None
    starter_code: str | None = None
    solution: str | None = None
    tests: list | None = None
    hints: list[str] | None = None
    language: str | None = None
    response_instructions: str | None = None
    file_required: bool | None = None
    allowed_file_types: str | None = None


class SubmitCodeRequest(BaseModel):
    code: str


class SubmitDeliverableRequest(BaseModel):
    response_text: str


class GradeSubmissionRequest(BaseModel):
    passed: bool
    feedback: str | None = None
    score: int | None = None


class LabResponse(CamelModel):
    id: str
    title: str
    description: str | None = None
    lab_type: str = "EXECUTABLE"
    language: str = "python"
    starter_code: str | None = None
    solution: str | None = None
    tests: list | None = None
    hints: list[str] | None = None
    module_id: str
    response_instructions: str | None = None
    file_required: bool = False
    allowed_file_types: str | None = None

    @field_validator("tests", mode="before")
    @classmethod
    def normalize_tests(cls, v: Any) -> list | None:
        return _coerce_tests(v)


class LabResponseStudent(CamelModel):
    id: str
    title: str
    description: str | None = None
    lab_type: str = "EXECUTABLE"
    language: str = "python"
    starter_code: str | None = None
    tests: list | None = None
    hints: list[str] | None = None
    module_id: str
    response_instructions: str | None = None
    file_required: bool = False
    allowed_file_types: str | None = None

    @field_validator("tests", mode="before")
    @classmethod
    def normalize_tests(cls, v: Any) -> list | None:
        return _coerce_tests(v)


class SubmissionResponse(CamelModel):
    id: str
    user_id: str
    lab_id: str
    code: str
    language: str = "python"
    passed: bool | None = None
    stdout: str | None = None
    stderr: str | None = None
    exit_code: int | None = None
    execution_time: int | None = None
    feedback: str | None = None
    response_text: str | None = None
    file_path: str | None = None
    score: int | None = None
    graded_by: str | None = None
    graded_at: datetime | None = None
    submitted_at: datetime | None = None
