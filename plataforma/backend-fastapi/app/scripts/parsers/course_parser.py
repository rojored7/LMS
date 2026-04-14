import json
from pathlib import Path

from app.scripts.parsers.types import ParsedCourse


def parse_course(course_dir: Path) -> ParsedCourse:
    # Try config.json first
    config_path = course_dir / "config.json"
    if config_path.exists():
        with open(config_path, encoding="utf-8") as f:
            config = json.load(f)
        return _build_from_config(config, course_dir)

    # Try YAML files
    for yaml_name in ["course.yaml", "course.yml", "config.yaml", "config.yml"]:
        yaml_path = course_dir / yaml_name
        if yaml_path.exists():
            try:
                import yaml
                with open(yaml_path, encoding="utf-8") as f:
                    config = yaml.safe_load(f)
                if config and isinstance(config, dict):
                    return _build_from_config(config, course_dir)
            except Exception:
                continue

    # Fallback: parse README.md
    readme = course_dir / "README.md"
    title = course_dir.name.replace("_", " ").replace("-", " ").title()
    desc = ""
    if readme.exists():
        lines = readme.read_text(encoding="utf-8", errors="replace").splitlines()
        if lines:
            title = lines[0].lstrip("# ").strip()
            desc = "\n".join(lines[1:]).strip()[:500]

    return ParsedCourse(slug=course_dir.name.lower(), title=title, description=desc)


def _build_from_config(config: dict, course_dir: Path) -> ParsedCourse:
    # Handle author field (can be string or list of dicts)
    authors = config.get("authors", [])
    author = "Platform"
    if isinstance(config.get("author"), str):
        author = config["author"]
    elif isinstance(authors, list) and authors:
        author = authors[0].get("name", "Platform") if isinstance(authors[0], dict) else str(authors[0])

    # Handle duration: support both `duration` (minutes) and `duration_hours`
    duration = config.get("duration", 0)
    if not duration and config.get("duration_hours"):
        duration = int(config["duration_hours"]) * 60

    # Handle tags: can be list of strings or comma-separated string
    tags = config.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",")]

    return ParsedCourse(
        slug=config.get("slug", course_dir.name.lower()),
        title=config.get("title", course_dir.name),
        description=config.get("description", ""),
        duration=duration if duration else 2400,
        level=config.get("level", "BEGINNER").upper(),
        tags=tags,
        author=author,
        version=config.get("version", "1.0"),
    )


def find_module_dirs(course_dir: Path) -> list[Path]:
    # Check for explicit modules/ directory first
    modules_dir = course_dir / "modules"
    if modules_dir.exists():
        return sorted([d for d in modules_dir.iterdir() if d.is_dir()])

    # Fallback: numbered directories at root level (01_*, 02_*, etc.)
    excluded = {
        "assets", "projects", ".git", "__pycache__", "recursos", "scripts",
        "docs", "images", "config", "tests", "solutions", ".github",
        "node_modules", "venv", ".venv", "dist", "build",
    }
    dirs = sorted([
        d for d in course_dir.iterdir()
        if d.is_dir() and d.name not in excluded and not d.name.startswith(".")
    ])
    return dirs
