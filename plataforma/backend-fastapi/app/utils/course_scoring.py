"""Weighted course difficulty scoring (1-10 scale).

The score is derived from two factors:
- Course level (60 % weight, 0-6 points)
- Course duration (40 % weight, 0-4 points)

The result is clamped to [1, 10].
"""

from __future__ import annotations

LEVEL_WEIGHTS: dict[str, int] = {
    "BEGINNER": 0,
    "INTERMEDIATE": 2,
    "ADVANCED": 4,
    "EXPERT": 6,
}


def calculate_course_score(level: str, duration_minutes: int) -> int:
    """Return a difficulty score between 1 and 10.

    Parameters
    ----------
    level:
        The course level as a string (e.g. ``"BEGINNER"``).
        Also accepts enum instances whose ``.value`` is a string.
    duration_minutes:
        Total course duration in minutes.
    """
    level_str = getattr(level, "value", level)
    level_points = LEVEL_WEIGHTS.get(str(level_str).upper(), 0)

    hours = max(0, duration_minutes) / 60.0

    # Piece-wise linear interpolation (0-4 range)
    if hours <= 10:
        duration_points = (hours / 10.0) * 1.0
    elif hours <= 30:
        duration_points = 1.0 + ((hours - 10) / 20.0) * 1.0
    elif hours <= 60:
        duration_points = 2.0 + ((hours - 30) / 30.0) * 1.0
    else:
        duration_points = 3.0 + min(1.0, (hours - 60) / 60.0)

    raw = level_points + duration_points
    return max(1, min(10, round(raw)))
