import re
from pathlib import Path

from app.scripts.parsers.types import ParsedLesson


def parse_lessons(module_dir: Path) -> list[ParsedLesson]:
    lessons_dir = module_dir / "lessons"
    if not lessons_dir.exists():
        md_files = sorted(module_dir.glob("*.md"))
        return [_parse_lesson_file(f, i + 1) for i, f in enumerate(md_files)] if md_files else []

    md_files = sorted(lessons_dir.glob("*.md"))
    return [_parse_lesson_file(f, i + 1) for i, f in enumerate(md_files)]


def _parse_lesson_file(path: Path, default_order: int) -> ParsedLesson:
    content = path.read_text(encoding="utf-8", errors="replace")
    lines = content.splitlines()

    title = path.stem.replace("_", " ").replace("-", " ").title()
    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("# ").strip()

    order = default_order
    match = re.match(r"^(\d+)", path.stem)
    if match:
        order = int(match.group(1))

    words = len(content.split())
    estimated_time = max(5, words // 200 * 5)

    lesson_type = "TEXT"
    if any(kw in content.lower() for kw in ["```python", "```javascript", "```bash"]):
        lesson_type = "INTERACTIVE"

    return ParsedLesson(
        order=order,
        title=title,
        content=content,
        type=lesson_type,
        estimated_time=estimated_time,
    )
