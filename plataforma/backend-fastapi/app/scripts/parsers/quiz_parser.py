import json
from pathlib import Path

from app.scripts.parsers.types import ParsedQuestion, ParsedQuiz


def parse_quizzes(module_dir: Path) -> list[ParsedQuiz]:
    quizzes_dir = module_dir / "quizzes"
    if not quizzes_dir.exists():
        return []

    quizzes = []
    for qf in sorted(quizzes_dir.glob("*.json")):
        try:
            with open(qf) as f:
                data = json.load(f)

            quiz = ParsedQuiz(
                title=data.get("title", qf.stem),
                description=data.get("description", ""),
                passing_score=data.get("passing_score", data.get("passingScore", 70)),
                time_limit=data.get("time_limit", data.get("timeLimit")),
                attempts=data.get("attempts", 3),
            )

            for i, q in enumerate(data.get("questions", [])):
                quiz.questions.append(
                    ParsedQuestion(
                        order=q.get("order", i + 1),
                        type=q.get("type", "MULTIPLE_CHOICE"),
                        question=q.get("question", ""),
                        options=q.get("options"),
                        correct_answer=q.get("correct_answer", q.get("correctAnswer", "")),
                        explanation=q.get("explanation"),
                    )
                )

            quizzes.append(quiz)
        except (json.JSONDecodeError, KeyError):
            continue

    return quizzes
