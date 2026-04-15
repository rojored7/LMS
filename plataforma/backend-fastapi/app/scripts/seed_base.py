"""
Seed base data: admin user, training profiles, sample badges.
Run: ADMIN_SEED_PASSWORD=... python -m app.scripts.seed_base
"""
import asyncio
import os

from sqlalchemy import select
import structlog

from app.config import get_settings
from app.database import get_session_factory
from app.models.gamification import Badge
from app.models.user import TrainingProfile, User, UserRole
from app.utils.security import hash_password

settings = get_settings()
logger = structlog.get_logger()


async def seed():
    admin_password = os.environ.get("ADMIN_SEED_PASSWORD")
    if not admin_password:
        raise RuntimeError(
            "ADMIN_SEED_PASSWORD no esta definida. "
            "Defina esta variable de entorno antes de ejecutar el seed."
        )

    session_factory = get_session_factory()
    async with session_factory() as db:
        try:
            result = await db.execute(select(User).where(User.email == "admin@ciber.local"))
            admin = result.scalar_one_or_none()
            if not admin:
                admin = User(
                    email="admin@ciber.local",
                    password_hash=hash_password(admin_password),
                    name="Administrador",
                    role=UserRole.ADMIN,
                )
                db.add(admin)
                logger.info("admin_user_created", email="admin@ciber.local")
            else:
                logger.info("admin_user_exists")

            profiles_data = [
                {"name": "Seguridad Ofensiva", "slug": "seguridad-ofensiva", "description": "Pentesting, hacking etico, red team y simulacion de adversarios", "icon": "sword", "color": "#ef4444"},
                {"name": "Seguridad Defensiva", "slug": "seguridad-defensiva", "description": "Blue team, deteccion de amenazas, SIEM y respuesta a incidentes", "icon": "shield-check", "color": "#3b82f6"},
                {"name": "Seguridad en la Nube", "slug": "seguridad-nube", "description": "Seguridad en AWS, Azure y GCP, arquitectura cloud segura", "icon": "cloud", "color": "#8b5cf6"},
                {"name": "Analisis Forense Digital", "slug": "analisis-forense", "description": "Investigacion digital, cadena de custodia, analisis de evidencia y respuesta legal", "icon": "microscope", "color": "#f59e0b"},
                {"name": "Gobierno, Riesgo y Cumplimiento", "slug": "grc", "description": "Gestion de riesgos, cumplimiento normativo, auditorias y marcos de seguridad", "icon": "scale", "color": "#10b981"},
                {"name": "Seguridad de Aplicaciones", "slug": "seguridad-aplicaciones", "description": "DevSecOps, codigo seguro, OWASP y pruebas de seguridad en software", "icon": "code", "color": "#06b6d4"},
                {"name": "Arquitectura de Seguridad", "slug": "arquitectura-seguridad", "description": "Diseno de redes seguras, hardening de infraestructura y arquitectura zero trust", "icon": "network", "color": "#6366f1"},
                {"name": "Inteligencia de Amenazas", "slug": "inteligencia-amenazas", "description": "Analisis de amenazas, threat intelligence, OSINT y analisis de malware", "icon": "radar", "color": "#f43f5e"},
                {"name": "Seguridad Industrial y OT", "slug": "seguridad-industrial-ot", "description": "Ciberseguridad en entornos industriales, SCADA, ICS y sistemas criticos", "icon": "factory", "color": "#ea580c"},
                {"name": "Fundamentos de Ciberseguridad", "slug": "fundamentos-ciberseguridad", "description": "Bases de seguridad informatica, redes y sistemas para iniciar tu carrera en ciberseguridad", "icon": "graduation-cap", "color": "#64748b"},
            ]
            for pdata in profiles_data:
                existing_result = await db.execute(select(TrainingProfile).where(TrainingProfile.slug == pdata["slug"]))
                existing = existing_result.scalar_one_or_none()
                if existing:
                    existing.name = pdata["name"]
                    existing.description = pdata["description"]
                    existing.icon = pdata["icon"]
                    existing.color = pdata["color"]
                    logger.info("training_profile_updated", name=pdata["name"])
                else:
                    db.add(TrainingProfile(**pdata))
                    logger.info("training_profile_created", name=pdata["name"])

            badges_data = [
                {"name": "Primer Paso", "slug": "primer-paso", "description": "Completa tu primera leccion", "icon": "star", "xp_reward": 10},
                {"name": "Explorador", "slug": "explorador", "description": "Inscribete en 3 cursos", "icon": "compass", "xp_reward": 25},
                {"name": "Persistente", "slug": "persistente", "description": "Completa 10 lecciones", "icon": "flame", "xp_reward": 50},
                {"name": "Hacker Etico", "slug": "hacker-etico", "description": "Completa el curso de seguridad ofensiva", "icon": "terminal", "xp_reward": 100},
                {"name": "Maestro Quiz", "slug": "maestro-quiz", "description": "Obtiene 100% en 5 quizzes", "icon": "brain", "xp_reward": 75},
            ]
            for bdata in badges_data:
                existing = await db.execute(select(Badge).where(Badge.name == bdata["name"]))
                if not existing.scalar_one_or_none():
                    db.add(Badge(**bdata))
                    logger.info("badge_created", name=bdata["name"])

            await db.commit()
            logger.info("seed_completed")
        except Exception as e:
            await db.rollback()
            logger.error("seed_failed", error=str(e))
            raise


if __name__ == "__main__":
    asyncio.run(seed())
