"""Email service for sending transactional emails."""
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import structlog

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.warning("smtp_not_configured", action="password_reset_email_skipped")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Restablecer contrasena - Plataforma Ciberseguridad"
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
    msg["To"] = to_email

    html = f"""\
<html><body>
<p>Has solicitado restablecer tu contrasena.</p>
<p><a href="{reset_url}">Haz clic aqui para restablecer tu contrasena</a></p>
<p>Este enlace expira en 1 hora.</p>
<p>Si no solicitaste esto, ignora este correo.</p>
</body></html>"""
    msg.attach(MIMEText(html, "html"))

    try:
        await asyncio.to_thread(_send_smtp, msg)
        logger.info("password_reset_email_sent")
    except Exception as e:
        logger.error("password_reset_email_failed", error=str(e))


def _send_smtp(msg: MIMEMultipart) -> None:
    port = settings.SMTP_PORT or 587
    with smtplib.SMTP(settings.SMTP_HOST, port) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASS)
        server.send_message(msg)
