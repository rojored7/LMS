import json
import re
from pathlib import Path

from app.scripts.parsers.types import ParsedQuestion, ParsedQuiz


def parse_quizzes(module_dir: Path) -> list[ParsedQuiz]:
    quizzes_dir = None
    for dirname in ["quizzes", "evaluacion", "evaluaciones"]:
        candidate = module_dir / dirname
        if candidate.exists() and candidate.is_dir():
            quizzes_dir = candidate
            break
    if quizzes_dir is None:
        return []

    quizzes = []

    # Parse JSON quiz files
    for qf in sorted(quizzes_dir.glob("*.json")):
        quiz = _parse_json_quiz(qf)
        if quiz:
            quizzes.append(quiz)

    # Parse Markdown quiz files (cuestionario.md format)
    for qf in sorted(quizzes_dir.glob("*.md")):
        quiz = _parse_md_quiz(qf)
        if quiz and quiz.questions:
            quizzes.append(quiz)

    return quizzes


def _parse_json_quiz(qf: Path) -> ParsedQuiz | None:
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

        return quiz
    except (json.JSONDecodeError, KeyError):
        return None


def _parse_md_quiz(qf: Path) -> ParsedQuiz | None:
    """Parse a Markdown quiz file with format:
    # TITLE
    ### N. Question text
    a) Option A
    b) Option B
    **Respuesta correcta**: b
    **Explicacion**: ...
    """
    try:
        content = qf.read_text(encoding="utf-8", errors="replace")
        lines = content.splitlines()

        title = qf.stem.replace("_", " ").title()
        passing_score = 70
        time_limit = None

        # Extract title from first heading
        for line in lines:
            if line.startswith("# "):
                title = line.lstrip("# ").strip()
                break

        # Extract metadata
        for line in lines:
            low = line.lower()
            if "puntuacion minima" in low or "aprobar" in low:
                match = re.search(r"(\d+)%", line)
                if match:
                    passing_score = int(match.group(1))
                else:
                    match = re.search(r"(\d+)/(\d+)", line)
                    if match:
                        passing_score = round(int(match.group(1)) / int(match.group(2)) * 100)
            if "tiempo" in low:
                match = re.search(r"(\d+)\s*minutos", low)
                if match:
                    time_limit = int(match.group(1))

        quiz = ParsedQuiz(
            title=title,
            description="",
            passing_score=passing_score,
            time_limit=time_limit,
            attempts=3,
        )

        # Parse questions: look for ### N. pattern
        question_blocks = re.split(r"(?=^### \d+\.)", content, flags=re.MULTILINE)

        for block in question_blocks:
            block = block.strip()
            if not block.startswith("### "):
                continue

            q_lines = block.splitlines()
            # Extract question text
            q_match = re.match(r"### \d+\.\s*(.*)", q_lines[0])
            if not q_match:
                continue
            question_text = q_match.group(1).strip()

            options = []
            correct_answer = None
            explanation = None

            for line in q_lines[1:]:
                line = line.strip()
                # Option: a) text, b) text, etc.
                opt_match = re.match(r"^([a-zA-Z])\)\s*(.*)", line)
                if opt_match:
                    options.append(opt_match.group(2).strip())
                    continue

                # Correct answer
                if "respuesta correcta" in line.lower():
                    ans_match = re.search(r":\s*([a-zA-Z])", line)
                    if ans_match:
                        letter = ans_match.group(1).lower()
                        idx = ord(letter) - ord("a")
                        correct_answer = idx

                # Explanation
                if "explicacion" in line.lower():
                    exp_match = re.search(r":\s*(.*)", line)
                    if exp_match:
                        explanation = exp_match.group(1).strip()

            if question_text and options:
                quiz.questions.append(
                    ParsedQuestion(
                        order=len(quiz.questions) + 1,
                        type="MULTIPLE_CHOICE",
                        question=question_text,
                        options=options,
                        correct_answer=correct_answer if correct_answer is not None else 0,
                        explanation=explanation,
                    )
                )

        return quiz
    except Exception:
        return None
