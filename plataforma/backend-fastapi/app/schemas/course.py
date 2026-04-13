from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import CamelModel


class CourseCreate(CamelModel):
    title: str = Field(min_length=3, max_length=255)
    slug: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10)
    short_description: str | None = None
    image: str | None = None
    level: str = "BEGINNER"
    duration_hours: int = 0
    price: float = 0.0
    published: bool = False
    instructor_id: str | None = None


class CourseUpdate(CamelModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    short_description: str | None = None
    image: str | None = None
    level: str | None = None
    duration_hours: int | None = None
    price: float | None = None
    published: bool | None = None
    instructor_id: str | None = None


class ModuleResponse(CamelModel):
    id: str
    title: str
    description: str | None = None
    order: int
    course_id: str
    created_at: datetime
    updated_at: datetime
    lessons: list["LessonResponse"] = []


class LessonResponse(CamelModel):
    id: str
    title: str
    content: str | None = None
    video_url: str | None = None
    type: str
    order: int
    duration_minutes: int
    module_id: str
    created_at: datetime
    updated_at: datetime
    user_progress: dict | None = None


class EnrollmentResponse(CamelModel):
    id: str
    user_id: str
    course_id: str
    progress: float
    completed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class CourseResponse(CamelModel):
    id: str
    title: str
    slug: str
    description: str
    short_description: str | None = None
    image: str | None = None
    level: str
    duration_hours: int
    price: float
    published: bool
    instructor_id: str | None = None
    created_at: datetime
    updated_at: datetime
    modules: list[ModuleResponse] = []
    enrollment_count: int = 0
    is_enrolled: bool = False


class CourseListResponse(CamelModel):
    id: str
    title: str
    slug: str
    description: str
    short_description: str | None = None
    image: str | None = None
    level: str
    duration_hours: int
    price: float
    published: bool
    instructor_id: str | None = None
    created_at: datetime
    updated_at: datetime
    enrollment_count: int = 0
    is_enrolled: bool = False
    module_count: int = 0


class ModuleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str | None = None
    order: int = 0


class ModuleUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    order: int | None = None


class LessonCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content: str | None = None
    video_url: str | None = None
    type: str = "TEXT"
    order: int = 0
    duration_minutes: int = 0


class LessonUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    video_url: str | None = None
    type: str | None = None
    order: int | None = None
    duration_minutes: int | None = None


ModuleResponse.model_rebuild()
