from datetime import datetime

from pydantic import Field, field_validator

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


class LdapConfigUpdate(CamelModel):
    server_url: str = Field(min_length=1, max_length=500)
    use_ssl: bool = False
    timeout: int = Field(default=10, ge=1, le=120)
    bind_dn: str = Field(default="", max_length=500)
    bind_password: str | None = None
    base_dn: str = Field(default="", max_length=500)
    search_filter: str = Field(default="(sAMAccountName={username})", max_length=500)
    email_attr: str = Field(default="mail", max_length=100)
    name_attr: str = Field(default="cn", max_length=100)
    group_attr: str = Field(default="memberOf", max_length=100)
    role_mapping: str = Field(default="{}", max_length=2000)

    @field_validator("server_url")
    @classmethod
    def validate_server_url(cls, v: str) -> str:
        if not v.startswith(("ldap://", "ldaps://")):
            raise ValueError("server_url debe iniciar con ldap:// o ldaps://")
        return v


class LdapConfigResponse(CamelModel):
    server_url: str = ""
    use_ssl: bool = False
    timeout: int = 10
    bind_dn: str = ""
    bind_password_set: bool = False
    base_dn: str = ""
    search_filter: str = "(sAMAccountName={username})"
    email_attr: str = "mail"
    name_attr: str = "cn"
    group_attr: str = "memberOf"
    role_mapping: str = "{}"
    updated_at: datetime | None = None


class LdapTestRequest(CamelModel):
    server_url: str = Field(min_length=1, max_length=500)
    use_ssl: bool = False
    timeout: int = Field(default=10, ge=1, le=30)
    bind_dn: str = Field(default="", max_length=500)
    bind_password: str = Field(default="", max_length=500)

    @field_validator("server_url")
    @classmethod
    def validate_server_url(cls, v: str) -> str:
        if not v.startswith(("ldap://", "ldaps://")):
            raise ValueError("server_url debe iniciar con ldap:// o ldaps://")
        return v


class LdapTestResponse(CamelModel):
    success: bool
    message: str
    details: str | None = None
