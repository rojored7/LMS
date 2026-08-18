"""Tests for email_service SMTP error propagation."""
import smtplib
from unittest.mock import AsyncMock, patch

import pytest

from app.middleware.error_handler import ExternalServiceError
from app.services import email_service


def test_external_service_error_has_503_status() -> None:
    exc = ExternalServiceError("SMTP no disponible")
    assert exc.status_code == 503
    assert exc.code == "SERVICE_UNAVAILABLE"
    assert exc.message == "SMTP no disponible"


@pytest.mark.asyncio
async def test_send_password_reset_email_raises_on_smtp_failure() -> None:
    """SMTP failure must propagate as ExternalServiceError, not be swallowed."""
    with patch.object(email_service, "settings") as mock_settings, \
         patch("asyncio.to_thread", new_callable=AsyncMock) as mock_thread:
        mock_settings.SMTP_HOST = "smtp.example.com"
        mock_settings.SMTP_USER = "user@example.com"
        mock_settings.SMTP_PASS = "secret"
        mock_settings.SMTP_FROM = "noreply@example.com"
        mock_thread.side_effect = smtplib.SMTPException("Connection refused")

        with pytest.raises(ExternalServiceError):
            await email_service.send_password_reset_email(
                "target@test.com", "https://example.com/reset?token=abc"
            )


@pytest.mark.asyncio
async def test_send_password_reset_email_skips_when_smtp_not_configured() -> None:
    """Missing SMTP config must return silently without raising."""
    with patch.object(email_service, "settings") as mock_settings:
        mock_settings.SMTP_HOST = ""
        mock_settings.SMTP_USER = ""
        mock_settings.SMTP_PASS = ""
        await email_service.send_password_reset_email(
            "user@test.com", "https://example.com/reset"
        )


@pytest.mark.asyncio
async def test_send_password_changed_email_raises_on_smtp_failure() -> None:
    """SMTP failure in confirmation email must propagate as ExternalServiceError."""
    with patch.object(email_service, "settings") as mock_settings, \
         patch("asyncio.to_thread", new_callable=AsyncMock) as mock_thread:
        mock_settings.SMTP_HOST = "smtp.example.com"
        mock_settings.SMTP_USER = "user@example.com"
        mock_settings.SMTP_PASS = "secret"
        mock_settings.SMTP_FROM = "noreply@example.com"
        mock_thread.side_effect = smtplib.SMTPException("timeout")

        with pytest.raises(ExternalServiceError):
            await email_service.send_password_changed_email("user@test.com", "Usuario")
