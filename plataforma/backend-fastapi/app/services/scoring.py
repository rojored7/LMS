"""Unified quiz scoring logic used by both QuizService and ProgressService."""


def calculate_quiz_score(questions: list, answers: dict[str, str]) -> tuple[int, int]:
    """Calculate quiz score. Returns (correct_count, total_questions)."""
    total = len(questions)
    correct = 0
    for question in questions:
        user_answer = answers.get(question.id)
        if user_answer is None:
            continue

        expected = question.correct_answer
        opts = question.options if isinstance(question.options, list) else []

        if isinstance(expected, int):
            if 0 <= expected < len(opts):
                if str(user_answer).strip().lower() == str(opts[expected]).strip().lower():
                    correct += 1
        elif isinstance(expected, str):
            if str(user_answer).strip().lower() == expected.strip().lower():
                correct += 1
            elif expected.isdigit():
                idx = int(expected)
                if 0 <= idx < len(opts) and str(user_answer).strip().lower() == str(opts[idx]).strip().lower():
                    correct += 1
        elif isinstance(expected, dict):
            answer_val = expected.get("value", expected)
            if str(user_answer).strip().lower() == str(answer_val).strip().lower():
                correct += 1
        elif isinstance(expected, list):
            user_list = answers.get(question.id)
            if isinstance(user_list, list) and sorted(str(a).lower() for a in user_list) == sorted(str(e).lower() for e in expected):
                correct += 1

    return correct, total
