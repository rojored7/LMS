import json
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Lab, Project, Question, Quiz
from app.models.course import Course, Lesson, Module
from app.scripts.parsers.types import CourseData


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug


async def import_course_to_db(db: AsyncSession, course_data: CourseData) -> str:
    slug = course_data.slug or _slugify(course_data.title)

    existing = await db.execute(select(Course).where(Course.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{__import__('uuid').uuid4().hex[:6]}"

    course = Course(
        title=course_data.title,
        slug=slug,
        description=course_data.description or course_data.title,
        short_description=course_data.short_description or "",
        level=course_data.level,
        duration_hours=course_data.duration_hours,
        published=False,
    )
    db.add(course)
    await db.flush()

    for mod_data in course_data.modules:
        module = Module(
            title=mod_data.title,
            description=mod_data.description or "",
            order=mod_data.order,
            course_id=course.id,
        )
        db.add(module)
        await db.flush()

        for lesson_data in mod_data.lessons:
            lesson = Lesson(
                title=lesson_data.title,
                content=lesson_data.content,
                type=lesson_data.type,
                order=lesson_data.order,
                duration_minutes=lesson_data.duration_minutes,
                video_url=lesson_data.video_url or None,
                module_id=module.id,
            )
            db.add(lesson)

        for quiz_data in mod_data.quizzes:
            quiz = Quiz(
                title=quiz_data.title,
                description=quiz_data.description or "",
                passing_score=quiz_data.passing_score,
                max_attempts=quiz_data.max_attempts,
                module_id=module.id,
            )
            db.add(quiz)
            await db.flush()

            for q_data in quiz_data.questions:
                question = Question(
                    text=q_data.text,
                    type=q_data.type,
                    options=q_data.options,
                    correct_answer=q_data.correct_answer,
                    explanation=q_data.explanation or "",
                    points=q_data.points,
                    order=q_data.order,
                    quiz_id=quiz.id,
                )
                db.add(question)

        for lab_data in mod_data.labs:
            lab = Lab(
                title=lab_data.title,
                description=lab_data.description or "",
                instructions=lab_data.instructions or "",
                starter_code=lab_data.starter_code or "",
                solution_code=lab_data.solution_code or "",
                test_code=lab_data.test_code or "",
                language=lab_data.language,
                timeout_seconds=lab_data.timeout_seconds,
                module_id=module.id,
            )
            db.add(lab)

        for proj_data in mod_data.projects:
            project = Project(
                title=proj_data.title,
                description=proj_data.description or "",
                requirements=proj_data.requirements or "",
                rubric=proj_data.rubric or "",
                module_id=module.id,
            )
            db.add(project)

        await db.flush()

    return course.id
