"""Slice 1: tests del modelo LdapConfiguration."""
import pytest

from app.models.admin_config import LdapConfiguration, LDAP_CONFIG_ID


def test_ldap_configuration_has_fixed_pk():
    row = LdapConfiguration()
    assert row.id == LDAP_CONFIG_ID


def test_ldap_configuration_tablename():
    assert LdapConfiguration.__tablename__ == "ldap_configuration"


def test_ldap_configuration_default_values():
    row = LdapConfiguration()
    assert row.server_url == ""
    assert row.use_ssl is False
    assert row.timeout == 10
    assert row.bind_dn == ""
    assert row.bind_password_encrypted == ""
    assert row.base_dn == ""
    assert row.search_filter == "(sAMAccountName={username})"
    assert row.email_attr == "mail"
    assert row.name_attr == "cn"
    assert row.group_attr == "memberOf"
    assert row.role_mapping == "{}"
    assert row.updated_at is None
