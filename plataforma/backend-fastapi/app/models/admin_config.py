from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

LDAP_CONFIG_ID = "ldap-config"


class LdapConfiguration(Base):
    __tablename__ = "ldap_configuration"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=LDAP_CONFIG_ID)
    server_url: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    use_ssl: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    timeout: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    bind_dn: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    bind_password_encrypted: Mapped[str] = mapped_column(Text, default="", nullable=False)
    base_dn: Mapped[str] = mapped_column(String(500), default="", nullable=False)
    search_filter: Mapped[str] = mapped_column(String(500), default="(sAMAccountName={username})", nullable=False)
    email_attr: Mapped[str] = mapped_column(String(100), default="mail", nullable=False)
    name_attr: Mapped[str] = mapped_column(String(100), default="cn", nullable=False)
    group_attr: Mapped[str] = mapped_column(String(100), default="memberOf", nullable=False)
    role_mapping: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    def __init__(self, **kwargs: object) -> None:
        kwargs.setdefault("id", LDAP_CONFIG_ID)
        kwargs.setdefault("server_url", "")
        kwargs.setdefault("use_ssl", False)
        kwargs.setdefault("timeout", 10)
        kwargs.setdefault("bind_dn", "")
        kwargs.setdefault("bind_password_encrypted", "")
        kwargs.setdefault("base_dn", "")
        kwargs.setdefault("search_filter", "(sAMAccountName={username})")
        kwargs.setdefault("email_attr", "mail")
        kwargs.setdefault("name_attr", "cn")
        kwargs.setdefault("group_attr", "memberOf")
        kwargs.setdefault("role_mapping", "{}")
        kwargs.setdefault("updated_at", None)
        super().__init__(**kwargs)
