import asyncio
import json
from datetime import datetime, timedelta, timezone

import structlog
from ldap3.utils.conv import escape_filter_chars
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.middleware.error_handler import AuthenticationError, ValidationError
from app.models.user import RefreshToken, User, UserRole
from app.services.token_service import TokenService

logger = structlog.get_logger()


class LdapService:
    def _get_connection(self, config: dict):
        try:
            import ldap3
        except ImportError:
            raise ValidationError(
                "La libreria ldap3 no esta instalada. Ejecute: pip install ldap3"
            )

        server = ldap3.Server(
            config["server_url"],
            use_ssl=config.get("use_ssl", False),
            connect_timeout=config.get("timeout", 10),
        )
        return server

    def _bind_user(self, username: str, password: str, config: dict) -> dict | None:
        import ldap3
        from ldap3.core.exceptions import LDAPBindError, LDAPException

        server = self._get_connection(config)

        try:
            conn = ldap3.Connection(
                server,
                user=config.get("bind_dn", ""),
                password=config.get("bind_password", ""),
                auto_bind=True,
                receive_timeout=config.get("timeout", 10),
            )
        except LDAPException as e:
            logger.error("ldap_service_bind_failed", error=str(e))
            raise AuthenticationError("No se pudo conectar al servidor LDAP")

        search_filter = config.get("search_filter", "(sAMAccountName={username})").replace("{username}", username)
        email_attr = config.get("email_attr", "mail")
        name_attr = config.get("name_attr", "cn")
        group_attr = config.get("group_attr", "memberOf")

        conn.search(
            search_base=config.get("base_dn", ""),
            search_filter=search_filter,
            attributes=[email_attr, name_attr, group_attr],
        )

        if not conn.entries:
            conn.unbind()
            return None

        entry = conn.entries[0]
        user_dn = entry.entry_dn
        conn.unbind()

        try:
            user_conn = ldap3.Connection(
                server,
                user=user_dn,
                password=password,
                auto_bind=True,
                receive_timeout=config.get("timeout", 10),
            )
            user_conn.unbind()
        except LDAPBindError:
            return None
        except LDAPException as e:
            logger.error("ldap_user_bind_failed", error=str(e))
            raise AuthenticationError("Error al autenticar con LDAP")

        email = str(entry[email_attr]) if email_attr in entry else None
        name = str(entry[name_attr]) if name_attr in entry else username
        groups = []
        if group_attr in entry:
            groups = list(entry[group_attr])

        return {
            "dn": user_dn,
            "email": email,
            "name": name,
            "groups": groups,
        }

    def _map_role(self, groups: list[str], config: dict) -> UserRole:
        try:
            mapping = json.loads(config.get("role_mapping", "{}"))
        except (json.JSONDecodeError, TypeError):
            return UserRole.STUDENT

        for group in groups:
            group_lower = group.lower()
            for pattern, role_str in mapping.items():
                if pattern.lower() in group_lower:
                    try:
                        return UserRole(role_str)
                    except ValueError:
                        continue
        return UserRole.STUDENT

    async def authenticate_and_sync(
        self,
        username: str,
        password: str,
        db: AsyncSession,
        token_service: TokenService,
    ) -> dict:
        settings = get_settings()
        if not settings.LDAP_ENABLED:
            raise ValidationError("LDAP no esta habilitado")

        from app.services.ldap_config_service import LdapConfigService
        config = await LdapConfigService().get_config(db)

        safe_username = escape_filter_chars(username)
        ldap_result = await asyncio.to_thread(self._bind_user, safe_username, password, config)
        if not ldap_result:
            raise AuthenticationError("Credenciales LDAP invalidas")

        email = ldap_result["email"]
        if not email:
            raise AuthenticationError("El usuario LDAP no tiene email configurado")

        ldap_dn = ldap_result["dn"]
        role = self._map_role(ldap_result["groups"], config)

        result = await db.execute(
            select(User).where(User.auth_provider == "ldap", User.external_id == ldap_dn)
        )
        user = result.scalar_one_or_none()

        if not user:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()

            if user:
                if user.auth_provider == "local":
                    user.auth_provider = "ldap"
                    user.external_id = ldap_dn
                    user.role = role
                    logger.info("ldap_account_linked", user_id=user.id)
                else:
                    raise AuthenticationError(
                        f"Este email ya esta registrado con {user.auth_provider}"
                    )
            else:
                user = User(
                    email=email,
                    password_hash=None,
                    name=ldap_result["name"],
                    role=role,
                    auth_provider="ldap",
                    external_id=ldap_dn,
                )
                db.add(user)
                await db.flush()
                logger.info("ldap_user_created", user_id=user.id)

        user.name = ldap_result["name"]
        user.role = role
        user.last_login_at = datetime.now(timezone.utc)

        access_token = token_service.create_access_token(user.id, user.email, user.role.value)
        refresh_token_value = token_service.create_refresh_token(user.id)

        now = datetime.now(timezone.utc)

        result = await db.execute(
            select(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .order_by(RefreshToken.created_at.asc())
        )
        existing = list(result.scalars().all())
        if len(existing) >= settings.MAX_SESSIONS_PER_USER:
            for old in existing[: len(existing) - settings.MAX_SESSIONS_PER_USER + 1]:
                await db.delete(old)

        rt = RefreshToken(
            user_id=user.id,
            token=refresh_token_value,
            expires_at=now + timedelta(days=settings.JWT_REFRESH_EXPIRES_IN_DAYS),
            session_started_at=now,
            last_activity_at=now,
        )
        db.add(rt)
        await db.flush()

        tokens = {
            "access_token": access_token,
            "refresh_token": refresh_token_value,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRES_IN_MINUTES * 60,
        }

        logger.info("ldap_login_success", user_id=user.id)
        return {"user": user, "tokens": tokens}
