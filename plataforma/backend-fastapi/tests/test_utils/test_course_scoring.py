"""Tests for the course scoring algorithm."""

import pytest

from app.utils.course_scoring import calculate_course_score


@pytest.mark.parametrize(
    "level, duration_minutes, expected",
    [
        # Minimum: beginner + zero duration -> clamp to 1
        ("BEGINNER", 0, 1),
        # Beginner + 5h (300min) -> 0 + 0.5 = 1
        ("BEGINNER", 300, 1),
        # Beginner + 10h (600min) -> 0 + 1.0 = 1
        ("BEGINNER", 600, 1),
        # Intermediate + 20h (1200min) -> 2 + 1.5 = 4
        ("INTERMEDIATE", 1200, 4),
        # Advanced + 30h (1800min) -> 4 + 2.0 = 6
        ("ADVANCED", 1800, 6),
        # Expert + 60h (3600min) -> 6 + 3.0 = 9
        ("EXPERT", 3600, 9),
        # Expert + 120h (7200min) -> 6 + 4.0 = 10
        ("EXPERT", 7200, 10),
        # Expert + 0 duration -> 6 + 0 = 6
        ("EXPERT", 0, 6),
        # Advanced + 0 duration -> 4 + 0 = 4
        ("ADVANCED", 0, 4),
        # Intermediate + 0 duration -> 2 + 0 = 2
        ("INTERMEDIATE", 0, 2),
        # Negative duration treated as 0
        ("BEGINNER", -100, 1),
        # Very long course: Expert + 200h -> 6 + 4 = 10
        ("EXPERT", 12000, 10),
        # Intermediate + 45h (2700min) -> 2 + 2.5 = 4.5 -> round = 4
        ("INTERMEDIATE", 2700, 4),
    ],
)
def test_calculate_course_score(
    level: str, duration_minutes: int, expected: int
) -> None:
    assert calculate_course_score(level, duration_minutes) == expected


def test_score_always_between_1_and_10() -> None:
    for level in ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]:
        for minutes in [0, 30, 60, 300, 600, 1800, 3600, 7200, 36000]:
            score = calculate_course_score(level, minutes)
            assert 1 <= score <= 10, f"score={score} for {level}, {minutes}min"
