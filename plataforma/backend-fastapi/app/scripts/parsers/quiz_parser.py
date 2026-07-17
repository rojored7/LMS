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

        # Parse questions: look for ### N., ### Pregunta N, ## Pregunta N or **Pregunta N:** patterns
        question_blocks = re.split(
            r"(?=^(?:#{2,3}\s+(?:\d+[.:-]|Pregunta\s+\d+)|\*\*Pregunta\s+\d+))",
            content,
            flags=re.MULTILINE,
        )

        for block in question_blocks:
            block = block.strip()
            if not (block.startswith("## ") or block.startswith("### ") or block.startswith("**Pregunta")):
                continue

            q_lines = block.splitlines()
            question_text = ""

            # Format A: ### 1. Question text here? or ### 1: Question text
            q_match = re.match(r"#{2,3}\s+\d+[.:]\s*(.*)", q_lines[0])
            if q_match and q_match.group(1).strip():
                question_text = q_match.group(1).strip()

            # Format B: ### Pregunta N / ## Pregunta N (question text on next non-empty line)
            if not question_text:
                q_match = re.match(r"#{2,3}\s+(?:Pregunta\s+)?\d+", q_lines[0])
                if q_match:
                    for line in q_lines[1:]:
                        line = line.strip()
                        if line and not line.startswith("a)") and not line.startswith("**") and line != "---":
                            question_text = line
                            break

            # Format C: **Pregunta N:** Question text here?
            if not question_text:
                q_match = re.match(r"\*\*Pregunta\s+\d+:\*\*\s*(.*)", q_lines[0])
                if q_match and q_match.group(1).strip():
                    question_text = q_match.group(1).strip()
                elif q_match:
                    for line in q_lines[1:]:
                        line = line.strip()
                        if line and not line.startswith("a)") and not line.startswith("**") and line != "---":
                            question_text = line
                            break

            if not question_text:
                continue

            options = []
            correct_answer = None
            explanation = None

            # Bug 2 fix: pre-scan the block to distinguish MC options from essay sub-parts.
            # a)/b)/c) lines are MC options only when:
            # - block has "**Respuesta correcta**:" inline marker, OR
            # - block has >= 2 lettered option lines AND they are not sub-questions
            #   (essay sub-parts end with "?" making them sub-questions, not choices)
            block_lower = block.lower()
            has_mc_marker = "respuesta correcta" in block_lower
            option_lines_raw = [
                ln.strip() for ln in q_lines[1:]
                if re.match(r"^[a-dA-D]\)\s", ln.strip())
            ]
            option_line_count = len(option_lines_raw)
            all_options_are_subquestions = (
                bool(option_lines_raw)
                and all(ln.rstrip().endswith("?") for ln in option_lines_raw)
            )
            is_mc_block = has_mc_marker or (option_line_count >= 2 and not all_options_are_subquestions)

            for line in q_lines[1:]:
                line = line.strip()
                if not line or line == "---":
                    continue

                # Bug 2 fix: only capture a)/b) as options in MC blocks
                opt_match = re.match(r"^([a-zA-Z])\)\s*(.*)", line)
                if opt_match and is_mc_block:
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
            elif question_text and not options:
                # Bug 3 fix: essay/open-answer questions → SHORT_ANSWER
                # correct_answer must be "" (str), NOT 0 (int) — scoring.py would
                # do opts[0] on options=None and raise IndexError.
                quiz.questions.append(
                    ParsedQuestion(
                        order=len(quiz.questions) + 1,
                        type="SHORT_ANSWER",
                        question=question_text,
                        options=None,
                        correct_answer="",
                        explanation=explanation,
                    )
                )

        # Bug 1 fix: match all real heading variants used in cuestionario.md files:
        # "## Respuestas", "## Clave de Respuestas", "## Respuestas de Referencia",
        # "## Soluciones", "## Respuestas y Explicaciones", "## Respuestas Resumidas"
        answer_section = re.search(
            r"##\s+(?:Clave\s+de\s+)?(?:Respuestas|Soluciones)(?:\s+\w+)*",
            content,
            re.IGNORECASE,
        )
        if answer_section:
            answer_text = content[answer_section.start():]
            # Bug 1 fix: removed trailing \) — real format is "### Respuesta N: B" (no paren)
            answer_matches = re.findall(r"### Respuesta\s+(\d+)[:.]\s*([a-zA-Z])", answer_text)
            # Fallback: numbered list format "1. B - explanation"
            if not answer_matches:
                answer_matches = re.findall(
                    r"^\s*(\d+)\.\s*([a-zA-Z])\s*[-\u2014]",
                    answer_text,
                    re.MULTILINE,
                )
            for q_num_str, letter in answer_matches:
                q_num = int(q_num_str)
                idx = ord(letter.lower()) - ord("a")
                if 0 < q_num <= len(quiz.questions):
                    quiz.questions[q_num - 1].correct_answer = idx

            # Also extract explanations from answer section
            explanation_blocks = re.split(r"(?=### Respuesta\s+\d+)", answer_text)
            for eblock in explanation_blocks:
                enum_match = re.match(r"### Respuesta\s+(\d+)", eblock)
                if not enum_match:
                    continue
                q_num = int(enum_match.group(1))
                # Everything after the first line is explanation
                elines = eblock.splitlines()[1:]
                explanation_text = " ".join(l.strip() for l in elines if l.strip() and not l.startswith("###")).strip()
                if explanation_text and 0 < q_num <= len(quiz.questions):
                    quiz.questions[q_num - 1].explanation = explanation_text

        return quiz
    except Exception:
        return None
