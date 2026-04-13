import json
from pathlib import Path

from app.scripts.parsers.types import ParsedProject


def parse_projects(course_dir: Path) -> list[ParsedProject]:
    projects_dir = course_dir / "projects"
    if not projects_dir.exists():
        return []

    projects = []
    for pf in sorted(projects_dir.glob("*.json")):
        try:
            with open(pf) as f:
                data = json.load(f)

            projects.append(
                ParsedProject(
                    title=data.get("title", pf.stem),
                    description=data.get("description", ""),
                    requirements=data.get("requirements", {}),
                    rubric=data.get("rubric", {}),
                )
            )
        except (json.JSONDecodeError, KeyError):
            continue

    return projects
