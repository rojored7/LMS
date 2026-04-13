"""
Seed base data: admin user, training profiles, sample badges.
Run: python -m app.scripts.seed_base
"""
import asyncio

from sqlalchemy import select

from app.config import get_settings
from app.database import get_session_factory
from app.models.gamification import Badge
from app.models.user import TrainingProfile, User, UserRole
from app.utils.security import hash_password

settings = get_settings()


async def seed():
    session_factory = get_session_factory()
    async with session_factory() as db:
        try:
            result = await db.execute(select(User).where(User.email == "admin@ciber.local"))
            admin = result.scalar_one_or_none()
            if not admin:
                admin = User(
                    email="admin@ciber.local",
                    password_hash=hash_password("Admin123!@#"),
                    name="Administrador",
                    role=UserRole.ADMIN,
                )
                db.add(admin)
                print("Admin user created: admin@ciber.local / Admin123!@#")
            else:
                print("Admin user already exists")

            profiles_data = [
                {"name": "Seguridad Ofensiva", "slug": "seguridad-ofensiva", "description": "Pentesting, hacking etico y red team", "icon": "shield-alert", "color": "#ef4444"},
                {"name": "Seguridad Defensiva", "slug": "seguridad-defensiva", "description": "Blue team, SIEM y respuesta a incidentes", "icon": "shield-check", "color": "#3b82f6"},
                {"name": "Seguridad en la Nube", "slug": "seguridad-nube", "description": "Seguridad en AWS, Azure y GCP", "icon": "cloud", "color": "#8b5cf6"},
                {"name": "Analisis Forense", "slug": "analisis-forense", "description": "Investigacion digital y analisis de evidencia", "icon": "search", "color": "#f59e0b"},
            ]
            for pdata in profiles_data:
                existing = await db.execute(select(TrainingProfile).where(TrainingProfile.slug == pdata["slug"]))
                if not existing.scalar_one_or_none():
                    db.add(TrainingProfile(**pdata))
                    print(f"Training profile created: {pdata['name']}")

            badges_data = [
                {"name": "Primer Paso", "description": "Completa tu primera leccion", "icon": "star", "criteria": "complete_first_lesson", "xp_reward": 10},
                {"name": "Explorador", "description": "Inscribete en 3 cursos", "icon": "compass", "criteria": "enroll_3_courses", "xp_reward": 25},
                {"name": "Persistente", "description": "Completa 10 lecciones", "icon": "flame", "criteria": "complete_10_lessons", "xp_reward": 50},
                {"name": "Hacker Etico", "description": "Completa el curso de seguridad ofensiva", "icon": "terminal", "criteria": "complete_offensive_course", "xp_reward": 100},
                {"name": "Maestro Quiz", "description": "Obtiene 100% en 5 quizzes", "icon": "brain", "criteria": "perfect_5_quizzes", "xp_reward": 75},
            ]
            for bdata in badges_data:
                existing = await db.execute(select(Badge).where(Badge.name == bdata["name"]))
                if not existing.scalar_one_or_none():
                    db.add(Badge(**bdata))
                    print(f"Badge created: {bdata['name']}")

            await db.commit()
            print("Seed completed successfully")
        except Exception as e:
            await db.rollback()
            print(f"Seed failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(seed())
