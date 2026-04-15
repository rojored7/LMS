import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.middleware.error_handler import ConflictError, NotFoundError
from app.models.assessment import Lab, Quiz, Question, QuestionType
from app.models.course import Course, CourseLevel, Lesson, LessonType, Module
from app.models.progress import Enrollment
from app.models.user import User
from app.services.progress_service import ProgressService


async def _seed_full_course(db: AsyncSession) -> dict:
    user = User(email="prog@test.com", password_hash="h", name="User")
    course = Course(slug="prog-course", title="C", description="D", duration=120, level=CourseLevel.BEGINNER, author="A", is_published=True)
    db.add_all([user, course])
    await db.commit()
    await db.refresh(user)
    await db.refresh(course)

    module = Module(course_id=course.id, order=1, title="M1", description="D", duration=60)
    db.add(module)
    await db.commit()
    await db.refresh(module)

    lesson = Lesson(module_id=module.id, order=1, title="L1", content="C", type=LessonType.TEXT, estimated_time=15)
    quiz = Quiz(module_id=module.id, title="Q1", description="D", passing_score=60, attempts=3)
    lab = Lab(module_id=module.id, title="Lab1", description="D", language="python", starter_code="", solution="", tests={})
    db.add_all([lesson, quiz, lab])
    await db.commit()
    await db.refresh(lesson)
    await db.refresh(quiz)
    await db.refresh(lab)

    # Create questions with correct answers
    q1 = Question(quiz_id=quiz.id, order=1, type=QuestionType.MULTIPLE_CHOICE, question="What is 2+2?", options=["3","4","5"], correct_answer="4")
    q2 = Question(quiz_id=quiz.id, order=2, type=QuestionType.TRUE_FALSE, question="Python is compiled?", options=["True","False"], correct_answer="False")
    q3 = Question(quiz_id=quiz.id, order=3, type=QuestionType.SHORT_ANSWER, question="Linux command to list files?", correct_answer="ls")
    db.add_all([q1, q2, q3])
    await db.commit()
    await db.refresh(q1)
    await db.refresh(q2)
    await db.refresh(q3)

    enrollment = Enrollment(user_id=user.id, course_id=course.id)
    db.add(enrollment)
    await db.commit()

    return {
        "user": user, "course": course, "module": module,
        "lesson": lesson, "quiz": quiz, "lab": lab,
        "questions": [q1, q2, q3],
    }


async def test_mark_lesson_complete(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    progress = await service.mark_lesson_complete(data["user"].id, data["lesson"].id)
    assert progress.completed is True
    assert progress.status == "completed"
    assert progress.progress == 100


async def test_mark_lesson_complete_idempotent(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    p1 = await service.mark_lesson_complete(data["user"].id, data["lesson"].id)
    p2 = await service.mark_lesson_complete(data["user"].id, data["lesson"].id)
    assert p1.id == p2.id


async def test_mark_lesson_not_found(db_session: AsyncSession) -> None:
    service = ProgressService(db_session)
    with pytest.raises(NotFoundError):
        await service.mark_lesson_complete("user1", "nonexistent")


async def test_quiz_scoring_all_correct(db_session: AsyncSession) -> None:
    """All answers correct -> 100%."""
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    attempt = await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "4", qs[1].id: "False", qs[2].id: "ls"},
    )
    assert attempt.score == 100
    assert attempt.passed is True


async def test_quiz_scoring_all_wrong(db_session: AsyncSession) -> None:
    """All answers wrong -> 0%."""
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    attempt = await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "999", qs[1].id: "True", qs[2].id: "dir"},
    )
    assert attempt.score == 0
    assert attempt.passed is False


async def test_quiz_scoring_partial(db_session: AsyncSession) -> None:
    """2 of 3 correct -> 67%, passes with passing_score=60."""
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    attempt = await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "4", qs[1].id: "False", qs[2].id: "wrong"},
    )
    assert attempt.score == 67
    assert attempt.passed is True


async def test_quiz_scoring_empty_answers(db_session: AsyncSession) -> None:
    """Empty answers -> 0%."""
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    attempt = await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id, {},
    )
    assert attempt.score == 0
    assert attempt.passed is False


async def test_quiz_scoring_case_insensitive(db_session: AsyncSession) -> None:
    """Scoring should be case-insensitive."""
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    attempt = await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "4", qs[1].id: "false", qs[2].id: "LS"},
    )
    assert attempt.score == 100


async def test_quiz_attempt_limit(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    for _ in range(3):
        await service.submit_quiz_attempt(data["user"].id, data["quiz"].id, {})

    with pytest.raises(ConflictError, match="Limite de intentos"):
        await service.submit_quiz_attempt(data["user"].id, data["quiz"].id, {})


async def test_submit_lab(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    submission = await service.submit_lab(
        user_id=data["user"].id, lab_id=data["lab"].id,
        code="print('hello')", language="python",
        passed=True, stdout="hello\n",
    )
    assert submission.passed is True
    assert submission.code == "print('hello')"


async def test_submit_lab_not_found(db_session: AsyncSession) -> None:
    service = ProgressService(db_session)
    with pytest.raises(NotFoundError):
        await service.submit_lab("user1", "nonexistent", "code", "python")


async def test_progress_materializes_in_enrollment(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    await service.mark_lesson_complete(data["user"].id, data["lesson"].id)

    progress = await service.get_course_progress(data["user"].id, data["course"].id)
    assert progress == 33  # 1/3 = 33%


async def test_progress_100_sets_completed_at(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    await service.mark_lesson_complete(data["user"].id, data["lesson"].id)
    await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "4", qs[1].id: "False", qs[2].id: "ls"},
    )
    await service.submit_lab(
        data["user"].id, data["lab"].id, "code", "python", passed=True,
    )

    progress = await service.get_course_progress(data["user"].id, data["course"].id)
    assert progress == 100


async def test_get_course_progress_no_enrollment(db_session: AsyncSession) -> None:
    service = ProgressService(db_session)
    progress = await service.get_course_progress("nonexistent", "nonexistent")
    assert progress == 0


async def test_detailed_progress_includes_quizzes_and_labs(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    result = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    mod = result["modules"][0]

    assert mod["lessons"] == {"total": 1, "completed": 0}
    assert mod["quizzes"] == {"total": 1, "passed": 0}
    assert mod["labs"] == {"total": 1, "passed": 0}
    assert mod["progress"] == 0
    assert result["overallProgress"] == 0


async def test_detailed_progress_counts_passed_quiz(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "4", qs[1].id: "False", qs[2].id: "ls"},
    )

    result = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    mod = result["modules"][0]
    assert mod["quizzes"] == {"total": 1, "passed": 1}
    assert mod["progress"] == 33


async def test_detailed_progress_counts_passed_lab(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    await service.submit_lab(
        data["user"].id, data["lab"].id, "code", "python", passed=True,
    )

    result = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    mod = result["modules"][0]
    assert mod["labs"] == {"total": 1, "passed": 1}
    assert mod["progress"] == 33


async def test_detailed_and_recalculate_consistent(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    qs = data["questions"]
    service = ProgressService(db_session)

    await service.mark_lesson_complete(data["user"].id, data["lesson"].id)
    detailed = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    enrollment_progress = await service.get_course_progress(data["user"].id, data["course"].id)
    assert detailed["overallProgress"] == enrollment_progress

    await service.submit_quiz_attempt(
        data["user"].id, data["quiz"].id,
        {qs[0].id: "4", qs[1].id: "False", qs[2].id: "ls"},
    )
    detailed = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    enrollment_progress = await service.get_course_progress(data["user"].id, data["course"].id)
    assert detailed["overallProgress"] == enrollment_progress

    await service.submit_lab(
        data["user"].id, data["lab"].id, "code", "python", passed=True,
    )
    detailed = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    enrollment_progress = await service.get_course_progress(data["user"].id, data["course"].id)
    assert detailed["overallProgress"] == enrollment_progress


async def test_detailed_progress_failed_quiz_not_counted(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    await service.submit_quiz_attempt(data["user"].id, data["quiz"].id, {})

    result = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    mod = result["modules"][0]
    assert mod["quizzes"] == {"total": 1, "passed": 0}
    assert result["overallProgress"] == 0


async def test_detailed_progress_failed_lab_not_counted(db_session: AsyncSession) -> None:
    data = await _seed_full_course(db_session)
    service = ProgressService(db_session)

    await service.submit_lab(
        data["user"].id, data["lab"].id, "bad", "python", passed=False,
    )

    result = await service.get_detailed_course_progress(data["user"].id, data["course"].id)
    mod = result["modules"][0]
    assert mod["labs"] == {"total": 1, "passed": 0}
    assert result["overallProgress"] == 0
