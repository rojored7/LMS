"""Tests RED para Permission enum y ROLE_PERMISSIONS matrix."""
import pytest
from app.models.user import UserRole


def test_permission_enum_has_exactly_20_members():
    from app.permissions import Permission
    assert len(Permission) == 20


def test_permission_values_are_strings():
    from app.permissions import Permission
    for perm in Permission:
        assert isinstance(perm.value, str)
        assert ":" in perm.value


def test_permission_values_are_unique():
    from app.permissions import Permission
    values = [p.value for p in Permission]
    assert len(values) == len(set(values))


def test_role_permissions_covers_all_three_roles():
    from app.permissions import ROLE_PERMISSIONS
    assert UserRole.ADMIN in ROLE_PERMISSIONS
    assert UserRole.INSTRUCTOR in ROLE_PERMISSIONS
    assert UserRole.STUDENT in ROLE_PERMISSIONS


def test_admin_has_all_permissions():
    from app.permissions import Permission, ROLE_PERMISSIONS
    admin_perms = ROLE_PERMISSIONS[UserRole.ADMIN]
    for perm in Permission:
        assert perm in admin_perms, f"ADMIN falta permiso: {perm}"


def test_instructor_has_exactly_11_permissions():
    from app.permissions import ROLE_PERMISSIONS
    instructor_perms = ROLE_PERMISSIONS[UserRole.INSTRUCTOR]
    assert len(instructor_perms) == 11, f"INSTRUCTOR tiene {len(instructor_perms)} permisos, esperados 11"


def test_instructor_has_content_permissions():
    from app.permissions import Permission, ROLE_PERMISSIONS
    instructor_perms = ROLE_PERMISSIONS[UserRole.INSTRUCTOR]
    expected = {
        Permission.COURSE_CREATE,
        Permission.COURSE_EDIT,
        Permission.MODULE_MANAGE,
        Permission.LESSON_MANAGE,
        Permission.QUIZ_MANAGE,
        Permission.LAB_MANAGE,
        Permission.PROJECT_MANAGE,
        Permission.ATTACHMENT_MANAGE,
        Permission.INSTRUCTOR_DASHBOARD,
        Permission.COURSE_ENROLL,
        Permission.CONTENT_READ,
    }
    assert instructor_perms == expected


def test_instructor_does_not_have_admin_permissions():
    from app.permissions import Permission, ROLE_PERMISSIONS
    instructor_perms = ROLE_PERMISSIONS[UserRole.INSTRUCTOR]
    admin_only = {
        Permission.ADMIN_PANEL,
        Permission.ANALYTICS_READ,
        Permission.EXPORT_DATA,
        Permission.TRAINING_PROFILE_WRITE,
        Permission.USER_LIST,
        Permission.USER_DELETE,
        Permission.INCIDENT_READ,
        Permission.BADGE_MANAGE,
        Permission.COURSE_DELETE,
    }
    for perm in admin_only:
        assert perm not in instructor_perms, f"INSTRUCTOR NO debe tener: {perm}"


def test_student_has_exactly_2_permissions():
    from app.permissions import ROLE_PERMISSIONS
    student_perms = ROLE_PERMISSIONS[UserRole.STUDENT]
    assert len(student_perms) == 2, f"STUDENT tiene {len(student_perms)} permisos, esperados 2"


def test_student_has_only_enroll_and_content_read():
    from app.permissions import Permission, ROLE_PERMISSIONS
    student_perms = ROLE_PERMISSIONS[UserRole.STUDENT]
    assert Permission.COURSE_ENROLL in student_perms
    assert Permission.CONTENT_READ in student_perms


def test_student_does_not_have_write_permissions():
    from app.permissions import Permission, ROLE_PERMISSIONS
    student_perms = ROLE_PERMISSIONS[UserRole.STUDENT]
    blocked = {
        Permission.ADMIN_PANEL, Permission.COURSE_CREATE, Permission.COURSE_EDIT,
        Permission.MODULE_MANAGE, Permission.LESSON_MANAGE, Permission.QUIZ_MANAGE,
        Permission.LAB_MANAGE, Permission.PROJECT_MANAGE,
    }
    for perm in blocked:
        assert perm not in student_perms, f"STUDENT NO debe tener: {perm}"


def test_has_permission_returns_true_for_authorized():
    from app.permissions import Permission, has_permission
    assert has_permission(UserRole.ADMIN, Permission.ADMIN_PANEL) is True
    assert has_permission(UserRole.INSTRUCTOR, Permission.COURSE_CREATE) is True
    assert has_permission(UserRole.STUDENT, Permission.CONTENT_READ) is True


def test_has_permission_returns_false_for_unauthorized():
    from app.permissions import Permission, has_permission
    assert has_permission(UserRole.STUDENT, Permission.ADMIN_PANEL) is False
    assert has_permission(UserRole.INSTRUCTOR, Permission.EXPORT_DATA) is False
    assert has_permission(UserRole.STUDENT, Permission.COURSE_CREATE) is False
