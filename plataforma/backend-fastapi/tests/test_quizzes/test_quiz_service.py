from types import SimpleNamespace

from app.services.scoring import calculate_quiz_score


def _q(qid: str, correct_answer, options=None):
    """Helper to create a question-like object."""
    return SimpleNamespace(id=qid, correct_answer=correct_answer, options=options or [])


def test_score_with_int_correct_answer() -> None:
    """When correct_answer is an int index, user answer must match the option at that index."""
    questions = [_q("q1", 2, ["A", "B", "C", "D"])]
    answers = {"q1": "C"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 1
    assert total == 1


def test_score_with_int_wrong_answer() -> None:
    questions = [_q("q1", 0, ["A", "B", "C"])]
    answers = {"q1": "B"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 0
    assert total == 1


def test_score_with_str_correct_answer() -> None:
    """When correct_answer is a string, direct comparison."""
    questions = [_q("q1", "verdadero")]
    answers = {"q1": "Verdadero"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 1
    assert total == 1


def test_score_with_str_index_fallback() -> None:
    """When correct_answer is a string digit, it can index into options."""
    questions = [_q("q1", "1", ["opt0", "opt1", "opt2"])]
    answers = {"q1": "opt1"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 1
    assert total == 1


def test_score_with_dict_correct_answer() -> None:
    """When correct_answer is a dict with 'value' key."""
    questions = [_q("q1", {"value": "42"})]
    answers = {"q1": "42"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 1
    assert total == 1


def test_score_with_list_correct_answer() -> None:
    """When correct_answer is a list, user must provide matching list."""
    questions = [_q("q1", ["A", "C"])]
    answers = {"q1": ["C", "A"]}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 1
    assert total == 1


def test_score_unanswered_question() -> None:
    """Unanswered questions count as incorrect."""
    questions = [_q("q1", "A"), _q("q2", "B")]
    answers = {"q1": "A"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 1
    assert total == 2


def test_score_multiple_questions_mixed() -> None:
    """Mixed correct and incorrect answers."""
    questions = [
        _q("q1", 0, ["Yes", "No"]),
        _q("q2", "blue"),
        _q("q3", 1, ["A", "B"]),
    ]
    answers = {"q1": "Yes", "q2": "red", "q3": "B"}
    correct, total = calculate_quiz_score(questions, answers)
    assert correct == 2
    assert total == 3


def test_score_empty_questions() -> None:
    """No questions results in 0/0."""
    correct, total = calculate_quiz_score([], {})
    assert correct == 0
    assert total == 0
