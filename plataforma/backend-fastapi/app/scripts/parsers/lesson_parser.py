import re
from pathlib import Path

from app.scripts.parsers.types import ParsedLesson


def parse_lessons(module_dir: Path) -> list[ParsedLesson]:
    # Search in multiple possible subdirectory names
    candidate_dirs = ["lessons", "teoria", "content", "lecciones"]
    for dirname in candidate_dirs:
        candidate = module_dir / dirname
        if candidate.exists() and candidate.is_dir():
            md_files = sorted(candidate.glob("*.md"))
            if md_files:
                return [_parse_lesson_file(f, i + 1) for i, f in enumerate(md_files)]

    # Fallback: look for .md files in module root (exclude README)
    md_files = sorted(f for f in module_dir.glob("*.md") if f.stem.lower() != "readme")
    if md_files:
        return [_parse_lesson_file(f, i + 1) for i, f in enumerate(md_files)]

    # Last resort: include README.md if it's the only content
    md_files = sorted(module_dir.glob("*.md"))
    return [_parse_lesson_file(f, i + 1) for i, f in enumerate(md_files)] if md_files else []


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
