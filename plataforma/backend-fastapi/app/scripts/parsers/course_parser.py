import re
from pathlib import Path

from app.scripts.parsers.types import CourseData
from app.scripts.parsers.module_parser import parse_module_directory


def _slugify(text: str) -> str:
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug


def parse_course_directory(course_dir: Path) -> CourseData:
    readme = course_dir / "README.md"
    title = course_dir.name.replace("_", " ").replace("-", " ").title()
    description = ""
    short_description = ""

    if readme.exists():
        content = readme.read_text(encoding="utf-8")
        lines = content.strip().split("\n")
        if lines and lines[0].startswith("#"):
            title = lines[0].lstrip("#").strip()
        if len(lines) > 1:
            desc_lines = [l for l in lines[1:] if l.strip() and not l.startswith("#")]
            if desc_lines:
                description = "\n".join(desc_lines[:10])
                short_description = desc_lines[0][:500]

    slug = _slugify(title)
    course = CourseData(title=title, slug=slug, description=description or title, short_description=short_description)

    module_dirs = sorted([d for d in course_dir.iterdir() if d.is_dir() and not d.name.startswith(".")])

    for idx, mod_dir in enumerate(module_dirs):
        module = parse_module_directory(mod_dir, order=idx)
        course.modules.append(module)

    total_lessons = sum(len(m.lessons) for m in course.modules)
    course.duration_hours = max(1, total_lessons * 5 // 60)

    return course
