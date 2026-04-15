from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import require_admin
from app.models.user import User
from app.schemas.common import ApiResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/stats")
async def get_platform_stats(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    stats = await service.get_platform_stats()
    return ApiResponse(success=True, data=stats).model_dump()


@router.get("/enrollment-trends")
async def get_enrollment_trends(
    days: int = Query(30, ge=1, le=365),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    trends = await service.get_enrollment_trends(days=days)
    return ApiResponse(success=True, data=trends).model_dump()


@router.get("/courses")
async def get_course_stats(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    stats = await service.get_course_stats()
    return ApiResponse(success=True, data=stats).model_dump()


@router.get("/user-activity")
async def get_user_activity(
    days: int = Query(7, ge=1, le=90),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    activity = await service.get_user_activity(days=days)
    return ApiResponse(success=True, data=activity).model_dump()


@router.get("/user-distribution")
async def get_user_distribution(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_user_distribution()
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_recent_activity(limit=limit)
    return ApiResponse(success=True, data=data).model_dump()


@router.get("/comparative-stats")
async def get_comparative_stats(
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    service = AnalyticsService(db)
    data = await service.get_comparative_stats()
    return ApiResponse(success=True, data=data).model_dump()
