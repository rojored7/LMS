from pydantic import BaseModel

from app.schemas.common import CamelModel


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


class LabResponseStudent(CamelModel):
    """Lab response without solution field for students."""
    id: str
    title: str
    description: str | None = None
    language: str = "python"
    starter_code: str | None = None
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
