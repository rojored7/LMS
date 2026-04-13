import json
import re
from pathlib import Path

from app.scripts.parsers.types import QuizData, QuizQuestionData


def parse_quiz_file(filepath: Path) -> QuizData | None:
    content = filepath.read_text(encoding="utf-8")
    lines = content.strip().split("\n")

    title = filepath.stem.replace("_", " ").replace("-", " ").title()
    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("#").strip()

    quiz = QuizData(title=title)
    questions: list[QuizQuestionData] = []

    current_question: dict | None = None
    current_options: list[str] = []
    correct_answer = ""
    explanation = ""

    for line in lines:
        stripped = line.strip()

        question_match = re.match(r"^(\d+)\.\s+(.+)", stripped)
        if question_match:
            if current_question:
                q = QuizQuestionData(
                    text=current_question["text"],
                    options=json.dumps(current_options) if current_options else "",
                    correct_answer=correct_answer,
                    explanation=explanation,
                    order=len(questions),
                )
                questions.append(q)

            current_question = {"text": question_match.group(2)}
            current_options = []
            correct_answer = ""
            explanation = ""
            continue

        option_match = re.match(r"^[-*]\s+\[([xX ])\]\s+([a-dA-D][\.\)]\s*)?(.+)", stripped)
        if not option_match:
            option_match = re.match(r"^([a-dA-D])[\.\)]\s+(.+)", stripped)
            if option_match:
                current_options.append(option_match.group(2))
                continue

        if option_match and len(option_match.groups()) >= 3:
            option_text = option_match.group(3)
            current_options.append(option_text)
            if option_match.group(1).lower() == "x":
                correct_answer = option_text
            continue

        if stripped.lower().startswith("respuesta:") or stripped.lower().startswith("answer:"):
            correct_answer = stripped.split(":", 1)[1].strip()
        elif stripped.lower().startswith("explicacion:") or stripped.lower().startswith("explanation:"):
            explanation = stripped.split(":", 1)[1].strip()

    if current_question:
        q = QuizQuestionData(
            text=current_question["text"],
            options=json.dumps(current_options) if current_options else "",
            correct_answer=correct_answer,
            explanation=explanation,
            order=len(questions),
        )
        questions.append(q)

    if not questions:
        return None

    quiz.questions = questions
    return quiz
