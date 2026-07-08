"""Slice 2: tests de schemas LDAP."""
import pytest
from pydantic import ValidationError

from app.schemas.admin import LdapConfigUpdate, LdapConfigResponse, LdapTestRequest


def test_ldap_config_update_rejects_invalid_url():
    with pytest.raises(ValidationError):
        LdapConfigUpdate(server_url="not-a-url")


def test_ldap_config_update_accepts_ldap_url():
    obj = LdapConfigUpdate(server_url="ldap://192.168.1.1:389")
    assert obj.server_url == "ldap://192.168.1.1:389"


def test_ldap_config_update_accepts_ldaps_url():
    obj = LdapConfigUpdate(server_url="ldaps://dc.corp.local")
    assert obj.server_url == "ldaps://dc.corp.local"


def test_ldap_config_response_has_bind_password_set_not_password():
    fields = LdapConfigResponse.model_fields
    assert "bind_password_set" in fields
    assert "bind_password" not in fields
    assert "bind_password_encrypted" not in fields


def test_ldap_config_update_bind_password_optional():
    obj = LdapConfigUpdate(server_url="ldap://x")
    assert obj.bind_password is None


def test_ldap_test_request_requires_server_url():
    with pytest.raises(ValidationError):
        LdapTestRequest()
