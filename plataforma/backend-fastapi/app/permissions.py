"""
Fuente unica de verdad para el sistema RBAC.

Para cambiar los permisos de un rol: editar ROLE_PERMISSIONS en este archivo.
Para agregar un nuevo permiso: agregar a Permission y actualizar ROLE_PERMISSIONS.
"""
import json
from enum import StrEnum

import structlog

from app.middleware.error_handler import AuthorizationError
from app.models.user import User, UserRole
from app.redis import redis_client

logger = structlog.get_logger()

_RBAC_CACHE_TTL = 300


class Permission(StrEnum):
    # Administracion exclusiva
    ADMIN_PANEL            = "admin:panel"
    ANALYTICS_READ         = "analytics:read"
    EXPORT_DATA            = "export:data"
    TRAINING_PROFILE_WRITE = "training_profile:write"
    USER_LIST              = "user:list"
    USER_DELETE            = "user:delete"
    INCIDENT_READ          = "incident:read"
    BADGE_MANAGE           = "badge:manage"
    COURSE_DELETE          = "course:delete"
    # Instructor + Admin
    COURSE_CREATE          = "course:create"
    COURSE_EDIT            = "course:edit"
    MODULE_MANAGE          = "module:manage"
    LESSON_MANAGE          = "lesson:manage"
    QUIZ_MANAGE            = "quiz:manage"
    LAB_MANAGE             = "lab:manage"
    PROJECT_MANAGE         = "project:manage"
    ATTACHMENT_MANAGE      = "attachment:manage"
    INSTRUCTOR_DASHBOARD   = "instructor:dashboard"
    # Todos los autenticados
    COURSE_ENROLL          = "course:enroll"
    CONTENT_READ           = "content:read"


_ADMIN_PERMISSIONS: frozenset[Permission] = frozenset(Permission)

_INSTRUCTOR_PERMISSIONS: frozenset[Permission] = frozenset({
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
})

_STUDENT_PERMISSIONS: frozenset[Permission] = frozenset({
    Permission.COURSE_ENROLL,
    Permission.CONTENT_READ,
})

ROLE_PERMISSIONS: dict[UserRole, frozenset[Permission]] = {
    UserRole.ADMIN:      _ADMIN_PERMISSIONS,
    UserRole.INSTRUCTOR: _INSTRUCTOR_PERMISSIONS,
    UserRole.STUDENT:    _STUDENT_PERMISSIONS,
}


def has_permission(role: UserRole, permission: Permission) -> bool:
    """Verifica si un rol tiene un permiso especifico."""
    return permission in ROLE_PERMISSIONS.get(role, frozenset())


async def _get_role_permissions_cached(role: UserRole) -> frozenset[Permission]:
    """Obtiene permisos del rol, usando Redis como cache."""
    cache_key = f"rbac:role:{role.value}"
    try:
        cached = await redis_client.get(cache_key)
        if cached:
            return frozenset(Permission(p) for p in json.loads(cached))
    except Exception:
        logger.warning("rbac_cache_read_error", role=role.value)

    perms = ROLE_PERMISSIONS[role]

    try:
        await redis_client.setex(cache_key, _RBAC_CACHE_TTL, json.dumps([p.value for p in perms]))
    except Exception:
        logger.warning("rbac_cache_write_error", role=role.value)

    return perms


def require_permission(permission: Permission):
    """
    FastAPI dependency factory. Verifica que el usuario autenticado
    tenga el permiso indicado segun su rol.

    Uso:
        @router.get("/ruta")
        async def endpoint(user = Depends(require_permission(Permission.COURSE_CREATE))):
            ...
    """
    from fastapi import Depends

    # Lazy import para evitar importacion circular: permissions -> auth -> permissions
    async def checker(user: User = Depends(_get_current_user_lazy())) -> User:
        role_perms = await _get_role_permissions_cached(user.role)
        if permission not in role_perms:
            raise AuthorizationError("No tiene permisos para acceder a este recurso")
        return user

    return checker


def _get_current_user_lazy():
    """Retorna get_current_user via importacion diferida para evitar circular import."""
    from app.middleware.auth import get_current_user
    return get_current_user
