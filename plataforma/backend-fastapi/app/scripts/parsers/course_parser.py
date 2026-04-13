import json
from pathlib import Path

from app.scripts.parsers.types import ParsedCourse


def parse_course(course_dir: Path) -> ParsedCourse:
    config_path = course_dir / "config.json"
    if config_path.exists():
        with open(config_path) as f:
            config = json.load(f)
        authors = config.get("authors", [])
        author = "Platform"
        if isinstance(authors, list) and authors:
            author = authors[0].get("name", "Platform") if isinstance(authors[0], dict) else str(authors[0])
        elif isinstance(config.get("author"), str):
            author = config["author"]
        return ParsedCourse(
            slug=config.get("slug", course_dir.name),
            title=config.get("title", course_dir.name),
            description=config.get("description", ""),
            duration=config.get("duration", 2400),
            level=config.get("level", "BEGINNER").upper(),
            tags=config.get("tags", []),
            author=author,
            version=config.get("version", "1.0"),
        )

    readme = course_dir / "README.md"
    title = course_dir.name.replace("_", " ").replace("-", " ").title()
    desc = ""
    if readme.exists():
        lines = readme.read_text(encoding="utf-8").splitlines()
        if lines:
            title = lines[0].lstrip("# ").strip()
            desc = "\n".join(lines[1:]).strip()[:500]

    return ParsedCourse(slug=course_dir.name.lower(), title=title, description=desc)


def find_module_dirs(course_dir: Path) -> list[Path]:
    modules_dir = course_dir / "modules"
    if modules_dir.exists():
        return sorted([d for d in modules_dir.iterdir() if d.is_dir()])

    dirs = sorted([d for d in course_dir.iterdir() if d.is_dir() and d.name not in ("assets", "projects", ".git", "__pycache__")])
    return dirs
