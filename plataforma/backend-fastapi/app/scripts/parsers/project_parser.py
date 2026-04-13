from pathlib import Path

from app.scripts.parsers.types import ProjectData


def parse_project_file(filepath: Path) -> ProjectData | None:
    content = filepath.read_text(encoding="utf-8")
    lines = content.strip().split("\n")

    title = filepath.stem.replace("_", " ").replace("-", " ").title()
    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("#").strip()

    description = ""
    requirements = ""
    rubric = ""
    section = "description"

    for line in lines:
        stripped = line.strip()
        lower = stripped.lower()

        if lower.startswith("## requisitos") or lower.startswith("## requirements") or lower.startswith("## requerimientos"):
            section = "requirements"
            continue
        elif lower.startswith("## rubrica") or lower.startswith("## rubric") or lower.startswith("## criterios"):
            section = "rubric"
            continue
        elif stripped.startswith("##"):
            if section not in ("requirements", "rubric"):
                section = "description"
            continue

        if section == "description":
            description += line + "\n"
        elif section == "requirements":
            requirements += line + "\n"
        elif section == "rubric":
            rubric += line + "\n"

    if not description.strip():
        description = title

    return ProjectData(
        title=title,
        description=description.strip(),
        requirements=requirements.strip(),
        rubric=rubric.strip(),
    )
