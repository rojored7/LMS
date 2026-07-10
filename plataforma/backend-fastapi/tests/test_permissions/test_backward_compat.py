"""Tests de equivalencia backward-compat: require_admin y require_instructor
siguen produciendo los mismos resultados que antes del refactor."""
import pytest
from app.models.user import User, UserRole
from app.middleware.error_handler import AuthorizationError
from app.permissions import ROLE_PERMISSIONS, Permission


def _make_user(role: UserRole) -> User:
    u = User()
    u.id = f"bc-{role.value}"
    u.email = f"bc-{role.value}@test.com"
    u.name = f"BC {role.value}"
    u.role = role
    u.xp = 0
    u.training_profile_id = None
    return u


class TestRequireAdminEquivalence:
    """require_admin debe comportarse igual que el antiguo require_role([ADMIN])."""

    async def test_admin_passes(self, mock_redis):
        # ADMIN tiene Permission.ADMIN_PANEL
        assert Permission.ADMIN_PANEL in ROLE_PERMISSIONS[UserRole.ADMIN]

    async def test_instructor_blocked(self, mock_redis):
        # INSTRUCTOR NO tiene Permission.ADMIN_PANEL
        assert Permission.ADMIN_PANEL not in ROLE_PERMISSIONS[UserRole.INSTRUCTOR]

    async def test_student_blocked(self, mock_redis):
        # STUDENT NO tiene Permission.ADMIN_PANEL
        assert Permission.ADMIN_PANEL not in ROLE_PERMISSIONS[UserRole.STUDENT]


class TestRequireInstructorEquivalence:
    """require_instructor debe comportarse igual que el antiguo require_role([ADMIN, INSTRUCTOR])."""

    async def test_admin_passes(self, mock_redis):
        # ADMIN tiene Permission.COURSE_CREATE (el permiso que usa require_instructor)
        assert Permission.COURSE_CREATE in ROLE_PERMISSIONS[UserRole.ADMIN]

    async def test_instructor_passes(self, mock_redis):
        # INSTRUCTOR tiene Permission.COURSE_CREATE
        assert Permission.COURSE_CREATE in ROLE_PERMISSIONS[UserRole.INSTRUCTOR]

    async def test_student_blocked(self, mock_redis):
        # STUDENT NO tiene Permission.COURSE_CREATE
        assert Permission.COURSE_CREATE not in ROLE_PERMISSIONS[UserRole.STUDENT]


class TestImportBackwardCompat:
    def test_require_admin_importable_from_auth(self):
        from app.middleware.auth import require_admin
        assert callable(require_admin)

    def test_require_instructor_importable_from_auth(self):
        from app.middleware.auth import require_instructor
        assert callable(require_instructor)

    def test_require_role_still_exists(self):
        from app.middleware.auth import require_role
        assert callable(require_role)

    def test_verify_module_ownership_still_exists(self):
        from app.middleware.auth import verify_module_ownership
        assert callable(verify_module_ownership)

    def test_require_instructor_only_removed(self):
        """require_instructor_only era dead code y debe haber sido eliminado."""
        import app.middleware.auth as auth_module
        assert not hasattr(auth_module, "require_instructor_only"), (
            "require_instructor_only debe haber sido eliminado (era dead code)"
        )
