from datetime import datetime
from pydantic import field_validator
from app.schemas.common import CamelModel


class CourseCreate(CamelModel):
    slug: str
    title: str
    description: str
    duration: int
    level: str
    author: str
    tags: list[str] | None = None
    thumbnail: str | None = None
    price: float = 0.0

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        v = v.strip().lower()
        if not v or len(v) < 3:
            raise ValueError("El slug debe tener al menos 3 caracteres")
        return v


class CourseUpdate(CamelModel):
    title: str | None = None
    description: str | None = None
    duration: int | None = None
    level: str | None = None
    tags: list[str] | None = None
    thumbnail: str | None = None
    price: float | None = None
    is_published: bool | None = None


class CourseResponse(CamelModel):
    id: str
    slug: str
    title: str
    description: str
    thumbnail: str | None = None
    duration: int
    level: str
    tags: list[str] | None = None
    is_published: bool
    author: str
    version: str
    price: float
    created_at: datetime
    updated_at: datetime
    module_count: int = 0
    enrollment_count: int = 0


class CourseDetailResponse(CourseResponse):
    is_enrolled: bool = False


class CourseListResponse(CamelModel):
    id: str
    slug: str
    title: str
    description: str
    thumbnail: str | None = None
    duration: int
    level: str
    is_published: bool
    author: str
    price: float


class LessonSummary(CamelModel):
    id: str
    title: str
    order: int
    type: str
    estimated_time: int


class QuizSummary(CamelModel):
    id: str
    title: str
    description: str | None = None


class LabSummary(CamelModel):
    id: str
    title: str
    description: str | None = None
    language: str | None = None


class ModuleResponse(CamelModel):
    id: str
    course_id: str
    order: int
    title: str
    description: str
    duration: int
    is_published: bool
    lessons: list[LessonSummary] = []
    quizzes: list[QuizSummary] = []
    labs: list[LabSummary] = []


class EnrollmentResponse(CamelModel):
    id: str
    user_id: str
    course_id: str
    progress: int
    enrolled_at: datetime
    completed_at: datetime | None = None
    is_new: bool = False
    course: CourseListResponse | None = None


class LessonResponse(CamelModel):
    id: str
    module_id: str
    order: int
    title: str
    content: str
    type: str
    estimated_time: int
