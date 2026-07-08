"""Service para configuracion LDAP persistida en DB."""
import base64
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.admin_config import LdapConfiguration, LDAP_CONFIG_ID

LDAP_CONFIG_DEFAULTS = {
    "server_url": "",
    "use_ssl": False,
    "timeout": 10,
    "bind_dn": "",
    "bind_password": "",
    "base_dn": "",
    "search_filter": "(sAMAccountName={username})",
    "email_attr": "mail",
    "name_attr": "cn",
    "group_attr": "memberOf",
    "role_mapping": "{}",
}


def _get_fernet():
    """Retorna una instancia Fernet usando JWT_SECRET como base de la clave."""
    from cryptography.fernet import Fernet
    secret = get_settings().JWT_SECRET
    raw = secret[:32].encode("utf-8").ljust(32)[:32]
    key = base64.urlsafe_b64encode(raw)
    return Fernet(key)


def _encrypt(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def _decrypt(ciphertext: str) -> str:
    if not ciphertext:
        return ""
    try:
        return _get_fernet().decrypt(ciphertext.encode()).decode()
    except Exception:
        return ""


def _row_to_dict(row: LdapConfiguration) -> dict:
    return {
        "server_url": row.server_url,
        "use_ssl": row.use_ssl,
        "timeout": row.timeout,
        "bind_dn": row.bind_dn,
        "bind_password": _decrypt(row.bind_password_encrypted),
        "base_dn": row.base_dn,
        "search_filter": row.search_filter,
        "email_attr": row.email_attr,
        "name_attr": row.name_attr,
        "group_attr": row.group_attr,
        "role_mapping": row.role_mapping,
        "updated_at": row.updated_at,
    }


def _env_fallback() -> dict:
    """Fallback: lee variables LDAP del .env si no hay fila en DB."""
    s = get_settings()
    return {
        "server_url": getattr(s, "LDAP_SERVER_URL", ""),
        "use_ssl": getattr(s, "LDAP_USE_SSL", False),
        "timeout": getattr(s, "LDAP_TIMEOUT", 10),
        "bind_dn": getattr(s, "LDAP_BIND_DN", ""),
        "bind_password": getattr(s, "LDAP_BIND_PASSWORD", ""),
        "base_dn": getattr(s, "LDAP_BASE_DN", ""),
        "search_filter": getattr(s, "LDAP_USER_SEARCH_FILTER", "(sAMAccountName={username})"),
        "email_attr": getattr(s, "LDAP_EMAIL_ATTR", "mail"),
        "name_attr": getattr(s, "LDAP_NAME_ATTR", "cn"),
        "group_attr": getattr(s, "LDAP_GROUP_ATTR", "memberOf"),
        "role_mapping": getattr(s, "LDAP_ROLE_MAPPING", "{}"),
        "updated_at": None,
    }


class LdapConfigService:
    async def get_config(self, db: AsyncSession) -> dict:
        row = (await db.execute(select(LdapConfiguration).where(LdapConfiguration.id == LDAP_CONFIG_ID))).scalar_one_or_none()
        if row is None:
            return _env_fallback()
        return _row_to_dict(row)

    async def save_config(self, db: AsyncSession, data: dict) -> dict:
        row = (await db.execute(select(LdapConfiguration).where(LdapConfiguration.id == LDAP_CONFIG_ID))).scalar_one_or_none()
        new_password = data.get("bind_password")
        if row is None:
            encrypted = _encrypt(new_password or "")
            row = LdapConfiguration(
                server_url=data.get("server_url", ""),
                use_ssl=data.get("use_ssl", False),
                timeout=data.get("timeout", 10),
                bind_dn=data.get("bind_dn", ""),
                bind_password_encrypted=encrypted,
                base_dn=data.get("base_dn", ""),
                search_filter=data.get("search_filter", "(sAMAccountName={username})"),
                email_attr=data.get("email_attr", "mail"),
                name_attr=data.get("name_attr", "cn"),
                group_attr=data.get("group_attr", "memberOf"),
                role_mapping=data.get("role_mapping", "{}"),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(row)
        else:
            row.server_url = data.get("server_url", row.server_url)
            row.use_ssl = data.get("use_ssl", row.use_ssl)
            row.timeout = data.get("timeout", row.timeout)
            row.bind_dn = data.get("bind_dn", row.bind_dn)
            if new_password is not None:
                row.bind_password_encrypted = _encrypt(new_password)
            row.base_dn = data.get("base_dn", row.base_dn)
            row.search_filter = data.get("search_filter", row.search_filter)
            row.email_attr = data.get("email_attr", row.email_attr)
            row.name_attr = data.get("name_attr", row.name_attr)
            row.group_attr = data.get("group_attr", row.group_attr)
            row.role_mapping = data.get("role_mapping", row.role_mapping)
            row.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(row)
        return _row_to_dict(row)

    def test_connection(self, config: dict) -> dict:
        """Prueba la conexion LDAP sin guardar. Debe ser llamado via asyncio.to_thread."""
        try:
            import ldap3
        except ImportError:
            return {"success": False, "message": "ldap3 no disponible", "details": None}

        server_url = config.get("server_url", "")
        bind_dn = config.get("bind_dn", "")
        bind_password = config.get("bind_password", "")
        use_ssl = config.get("use_ssl", False)
        timeout = config.get("timeout", 10)

        try:
            server = ldap3.Server(server_url, use_ssl=use_ssl, connect_timeout=timeout)
            conn = ldap3.Connection(
                server,
                user=bind_dn,
                password=bind_password,
                authentication=ldap3.SIMPLE,
                auto_bind=ldap3.AUTO_BIND_TLS_BEFORE_BIND if use_ssl else ldap3.AUTO_BIND_NO_TLS,
            )
            if not conn.bind():
                return {
                    "success": False,
                    "message": "Bind fallido",
                    "details": str(conn.result),
                }
            conn.unbind()
            return {"success": True, "message": "Conexion exitosa", "details": None}
        except Exception as exc:
            return {"success": False, "message": "Error de conexion", "details": str(exc)}
