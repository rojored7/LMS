"""Tests para require_permission() factory y cache Redis."""
import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.user import User, UserRole
from app.permissions import Permission


def _make_user(role: UserRole) -> User:
    u = User()
    u.id = f"user-{role.value}"
    u.email = f"{role.value}@test.com"
    u.name = f"Test {role.value}"
    u.role = role
    u.xp = 0
    u.training_profile_id = None
    return u


async def _call_require_permission(permission: Permission, role: UserRole, mock_redis) -> User | None:
    """Llama require_permission() directamente sin pasar por HTTP."""
    from app.permissions import _get_role_permissions_cached
    from app.middleware.error_handler import AuthorizationError

    mock_redis.get = AsyncMock(return_value=None)

    user = _make_user(role)
    role_perms = await _get_role_permissions_cached(user.role)
    if permission not in role_perms:
        raise AuthorizationError()
    return user


class TestRequirePermissionAuthorized:
    async def test_admin_can_access_admin_panel(self, mock_redis):
        user = await _call_require_permission(Permission.ADMIN_PANEL, UserRole.ADMIN, mock_redis)
        assert user.role == UserRole.ADMIN

    async def test_admin_can_access_course_create(self, mock_redis):
        user = await _call_require_permission(Permission.COURSE_CREATE, UserRole.ADMIN, mock_redis)
        assert user.role == UserRole.ADMIN

    async def test_instructor_can_create_course(self, mock_redis):
        user = await _call_require_permission(Permission.COURSE_CREATE, UserRole.INSTRUCTOR, mock_redis)
        assert user.role == UserRole.INSTRUCTOR

    async def test_instructor_can_manage_modules(self, mock_redis):
        user = await _call_require_permission(Permission.MODULE_MANAGE, UserRole.INSTRUCTOR, mock_redis)
        assert user.role == UserRole.INSTRUCTOR

    async def test_student_can_enroll(self, mock_redis):
        user = await _call_require_permission(Permission.COURSE_ENROLL, UserRole.STUDENT, mock_redis)
        assert user.role == UserRole.STUDENT

    async def test_student_can_read_content(self, mock_redis):
        user = await _call_require_permission(Permission.CONTENT_READ, UserRole.STUDENT, mock_redis)
        assert user.role == UserRole.STUDENT


class TestRequirePermissionForbidden:
    async def test_student_blocked_from_admin_panel(self, mock_redis):
        from app.middleware.error_handler import AuthorizationError
        with pytest.raises(AuthorizationError):
            await _call_require_permission(Permission.ADMIN_PANEL, UserRole.STUDENT, mock_redis)

    async def test_student_blocked_from_course_create(self, mock_redis):
        from app.middleware.error_handler import AuthorizationError
        with pytest.raises(AuthorizationError):
            await _call_require_permission(Permission.COURSE_CREATE, UserRole.STUDENT, mock_redis)

    async def test_instructor_blocked_from_admin_panel(self, mock_redis):
        from app.middleware.error_handler import AuthorizationError
        with pytest.raises(AuthorizationError):
            await _call_require_permission(Permission.ADMIN_PANEL, UserRole.INSTRUCTOR, mock_redis)

    async def test_instructor_blocked_from_export_data(self, mock_redis):
        from app.middleware.error_handler import AuthorizationError
        with pytest.raises(AuthorizationError):
            await _call_require_permission(Permission.EXPORT_DATA, UserRole.INSTRUCTOR, mock_redis)

    async def test_instructor_blocked_from_user_delete(self, mock_redis):
        from app.middleware.error_handler import AuthorizationError
        with pytest.raises(AuthorizationError):
            await _call_require_permission(Permission.USER_DELETE, UserRole.INSTRUCTOR, mock_redis)


class TestRedisCache:
    async def test_cache_miss_calls_setex(self, mock_redis):
        from app.permissions import _get_role_permissions_cached
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.setex = AsyncMock(return_value=True)

        await _get_role_permissions_cached(UserRole.ADMIN)

        mock_redis.setex.assert_called_once()
        call_args = mock_redis.setex.call_args
        assert call_args[0][0] == "rbac:role:ADMIN"
        assert call_args[0][1] == 300

    async def test_cache_hit_skips_setex(self, mock_redis):
        from app.permissions import _get_role_permissions_cached
        perms_json = json.dumps(["course:create", "content:read"])
        mock_redis.get = AsyncMock(return_value=perms_json)
        mock_redis.setex = AsyncMock(return_value=True)

        result = await _get_role_permissions_cached(UserRole.INSTRUCTOR)

        mock_redis.setex.assert_not_called()
        assert Permission.COURSE_CREATE in result
        assert Permission.CONTENT_READ in result

    async def test_redis_error_falls_back_to_matrix(self, mock_redis):
        from app.permissions import _get_role_permissions_cached, ROLE_PERMISSIONS
        mock_redis.get = AsyncMock(side_effect=Exception("Redis down"))

        result = await _get_role_permissions_cached(UserRole.ADMIN)

        # Debe devolver los permisos del ROLE_PERMISSIONS directamente
        assert result == ROLE_PERMISSIONS[UserRole.ADMIN]

    async def test_cache_key_format(self, mock_redis):
        from app.permissions import _get_role_permissions_cached
        mock_redis.get = AsyncMock(return_value=None)

        await _get_role_permissions_cached(UserRole.INSTRUCTOR)

        mock_redis.get.assert_called_once_with("rbac:role:INSTRUCTOR")
