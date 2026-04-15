from datetime import datetime

from app.schemas.common import CamelModel


class AdminCourseInfo(CamelModel):
    id: str
    slug: str
    title: str
    thumbnail: str | None = None
    level: str
    duration: int = 0


class AdminEnrollmentResponse(CamelModel):
    id: str
    enrolled_at: datetime | None = None
    completed_at: datetime | None = None
    progress: int = 0
    course: AdminCourseInfo | None = None


class AdminUserWithEnrollments(CamelModel):
    id: str
    email: str
    name: str
    role: str
    avatar: str | None = None
    created_at: datetime | None = None
    enrollments: list[AdminEnrollmentResponse] = []
