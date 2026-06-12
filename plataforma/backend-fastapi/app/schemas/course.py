from datetime import datetime
from typing import Literal

from pydantic import Field, field_validator

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
    tags: list[str] = []
    is_published: bool

    @field_validator("tags", mode="before")
    @classmethod
    def coerce_tags(cls, v: list[str] | None) -> list[str]:
        return v if v is not None else []
    author: str
    version: str
    price: float
    score: int = 1
    created_at: datetime
    updated_at: datetime
    module_count: int = 0
    enrollment_count: int = 0


class CourseDetailResponse(CourseResponse):
    is_enrolled: bool = False


class CourseAdminDetailResponse(CourseResponse):
    modules: list["ModuleAdminResponse"] = []


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
    score: int = 1


class LessonSummary(CamelModel):
    id: str
    title: str
    order: int
    type: str
    estimated_time: int


class LessonAdminSummary(LessonSummary):
    content: str = ""


class QuizSummary(CamelModel):
    id: str
    title: str
    description: str | None = None
    passing_score: int = 0
    question_count: int = 0


class LabSummary(CamelModel):
    id: str
    title: str
    description: str | None = None
    language: str | None = None
    test_case_count: int = 0


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


class ModuleAdminResponse(CamelModel):
    id: str
    course_id: str
    order: int
    title: str
    description: str
    duration: int
    is_published: bool
    lessons: list[LessonAdminSummary] = []
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
    video_url: str | None = None
    video_provider: str | None = None


class ModuleCreate(CamelModel):
    title: str
    description: str = ""
    duration: int = 0
    order: int = 0
    is_published: bool = False

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 2:
            raise ValueError("El titulo debe tener al menos 2 caracteres")
        return v


class ModuleUpdate(CamelModel):
    title: str | None = None
    description: str | None = None
    duration: int | None = None
    order: int | None = None
    is_published: bool | None = None


_ALLOWED_VIDEO_HOSTS = frozenset({
    "youtube.com", "www.youtube.com", "youtu.be",
    "vimeo.com", "www.vimeo.com",
    "loom.com", "www.loom.com",
    "drive.google.com",
})


def _validate_video_url(url: str | None) -> str | None:
    if url is None:
        return None
    url = url.strip()
    if not url:
        return None
    from urllib.parse import urlparse
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("La URL del video debe comenzar con http:// o https://")
    host = parsed.netloc.lower()
    if host not in _ALLOWED_VIDEO_HOSTS:
        raise ValueError(
            f"Proveedor de video no permitido: {host}. "
            "Usa YouTube, Vimeo, Loom o Google Drive."
        )
    return url


def _detect_provider(url: str | None) -> str | None:
    if url is None:
        return None
    if "youtu" in url:
        return "youtube"
    if "vimeo.com" in url:
        return "vimeo"
    if "loom.com" in url:
        return "loom"
    if "drive.google.com" in url:
        return "gdrive"
    return "other"


class LessonCreate(CamelModel):
    title: str
    content: str = Field(default="", max_length=500000)
    type: Literal["TEXT", "VIDEO", "INTERACTIVE", "READING"] = "TEXT"
    order: int = 0
    estimated_time: int = 0
    video_url: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 2:
            raise ValueError("El titulo debe tener al menos 2 caracteres")
        return v

    @field_validator("video_url")
    @classmethod
    def validate_video_url(cls, v: str | None) -> str | None:
        return _validate_video_url(v)


class LessonUpdate(CamelModel):
    title: str | None = None
    content: str | None = Field(default=None, max_length=500000)
    type: Literal["TEXT", "VIDEO", "INTERACTIVE", "READING"] | None = None
    order: int | None = None
    estimated_time: int | None = None
    video_url: str | None = None

    @field_validator("video_url")
    @classmethod
    def validate_video_url(cls, v: str | None) -> str | None:
        return _validate_video_url(v)


class ModuleReorderRequest(CamelModel):
    module_ids: list[str]


class LessonReorderRequest(CamelModel):
    lesson_ids: list[str]


class WizardLessonData(CamelModel):
    title: str
    content: str = ""
    order: int = 0


class WizardModuleData(CamelModel):
    title: str
    description: str = ""
    order: int = 0
    lessons: list[WizardLessonData] = []


class AdminCourseCreate(CamelModel):
    title: str
    description: str
    level: Literal["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] = "BEGINNER"
    duration: int = 1
    tags: list[str] = []
    prerequisites: list[str] = []
    objectives: list[str] = []
    is_published: bool = False
    modules: list[WizardModuleData] = []

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) < 3:
            raise ValueError("El titulo debe tener al menos 3 caracteres")
        return v
