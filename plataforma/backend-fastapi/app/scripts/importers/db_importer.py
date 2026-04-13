import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Lab, Project, Question, Quiz
from app.models.course import Course, CourseLevel, Lesson, LessonType, Module
from app.scripts.parsers.types import ParsedCourse

logger = structlog.get_logger()

LEVEL_MAP = {
    "BEGINNER": CourseLevel.BEGINNER,
    "INTERMEDIATE": CourseLevel.INTERMEDIATE,
    "ADVANCED": CourseLevel.ADVANCED,
    "EXPERT": CourseLevel.EXPERT,
}

LESSON_TYPE_MAP = {
    "TEXT": LessonType.TEXT,
    "VIDEO": LessonType.VIDEO,
    "INTERACTIVE": LessonType.INTERACTIVE,
    "READING": LessonType.READING,
}


async def import_course_to_db(
    parsed: ParsedCourse,
    db: AsyncSession,
    publish: bool = False,
    force: bool = False,
) -> str:
    existing = await db.execute(select(Course).where(Course.slug == parsed.slug))
    if existing.scalar_one_or_none():
        if force:
            old = (await db.execute(select(Course).where(Course.slug == parsed.slug))).scalar_one()
            await db.delete(old)
            await db.flush()
        else:
            raise ValueError(f"Curso con slug '{parsed.slug}' ya existe. Usa force para sobreescribir.")

    course = Course(
        slug=parsed.slug,
        title=parsed.title,
        description=parsed.description,
        duration=parsed.duration,
        level=LEVEL_MAP.get(parsed.level, CourseLevel.BEGINNER),
        tags=parsed.tags,
        author=parsed.author,
        version=parsed.version,
        is_published=publish,
    )
    db.add(course)
    await db.flush()
    await db.refresh(course)

    for pm in parsed.modules:
        module = Module(
            course_id=course.id,
            order=pm.order,
            title=pm.title,
            description=pm.description or "",
            duration=pm.duration,
            is_published=publish,
        )
        db.add(module)
        await db.flush()
        await db.refresh(module)

        for pl in pm.lessons:
            db.add(Lesson(
                module_id=module.id,
                order=pl.order,
                title=pl.title,
                content=pl.content,
                type=LESSON_TYPE_MAP.get(pl.type, LessonType.TEXT),
                estimated_time=pl.estimated_time,
            ))

        for pq in pm.quizzes:
            quiz = Quiz(
                module_id=module.id,
                title=pq.title,
                description=pq.description,
                passing_score=pq.passing_score,
                time_limit=pq.time_limit,
                attempts=pq.attempts,
            )
            db.add(quiz)
            await db.flush()
            await db.refresh(quiz)

            for pquest in pq.questions:
                db.add(Question(
                    quiz_id=quiz.id,
                    order=pquest.order,
                    type=pquest.type,
                    question=pquest.question,
                    options=pquest.options,
                    correct_answer=pquest.correct_answer,
                    explanation=pquest.explanation,
                ))

        for plab in pm.labs:
            db.add(Lab(
                module_id=module.id,
                title=plab.title,
                description=plab.description,
                language=plab.language,
                starter_code=plab.starter_code,
                solution=plab.solution,
                tests=plab.tests,
                hints=plab.hints,
            ))

    for pp in parsed.projects:
        db.add(Project(
            course_id=course.id,
            title=pp.title,
            description=pp.description,
            requirements=pp.requirements,
            rubric=pp.rubric,
        ))

    await db.flush()
    logger.info("import_complete", course_id=course.id, slug=course.slug)
    return course.id
