from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.permissions import Permission, require_permission
from app.schemas.common import ApiResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/stats")
async def get_platform_stats(
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    stats = await service.get_platform_stats(area_id=area_id)
    return ApiResponse(success=True, data=stats).model_dump()


@router.get("/enrollment-trends")
async def get_enrollment_trends(
    days: int = Query(30, ge=1, le=365),
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    trends = await service.get_enrollment_trends(days=days, area_id=area_id)
    return ApiResponse(success=True, data=trends).model_dump()


@router.get("/courses")
async def get_course_stats(
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    stats = await service.get_course_stats(area_id=area_id)
    return ApiResponse(success=True, data=stats).model_dump()


@router.get("/user-activity")
async def get_user_activity(
    days: int = Query(7, ge=1, le=90),
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    activity = await service.get_user_activity(days=days, area_id=area_id)
    return ApiResponse(success=True, data=activity).model_dump()


@router.get("/user-distribution")
async def get_user_distribution(
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_user_distribution(area_id=area_id)
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_recent_activity(limit=limit, area_id=area_id)
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/comparative-stats")
async def get_comparative_stats(
    area_id: str | None = Query(None),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_comparative_stats(area_id=area_id)
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/time-tracking/users")
async def get_users_time_summary(
    course_id: str | None = Query(None),
    area_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_users_time_summary(
        course_id=course_id, area_id=area_id, limit=limit, offset=offset
    )
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/time-tracking/courses/{course_id}")
async def get_course_lesson_time_stats(
    course_id: str,
    user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_course_lesson_time_stats(course_id=course_id)
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/time-tracking/users/{user_id}/courses/{course_id}")
async def get_user_course_lesson_times(
    user_id: str,
    course_id: str,
    current_user: User = Depends(require_permission(Permission.ANALYTICS_READ)),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_user_course_lesson_times(user_id=user_id, course_id=course_id)
    return ApiResponse(success=True, data=data).model_dump()
