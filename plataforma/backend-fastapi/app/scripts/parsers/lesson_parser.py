from pathlib import Path

from app.scripts.parsers.types import LessonData


def parse_lesson_file(filepath: Path, order: int = 0) -> LessonData:
    content = filepath.read_text(encoding="utf-8")
    lines = content.strip().split("\n")

    title = filepath.stem.replace("_", " ").replace("-", " ").title()
    num_prefix = title.split(" ")[0]
    if num_prefix.isdigit():
        title = " ".join(title.split(" ")[1:])

    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("#").strip()

    lesson_type = "TEXT"
    video_url = ""
    for line in lines:
        if "youtube.com" in line or "vimeo.com" in line:
            lesson_type = "VIDEO"
            import re
            urls = re.findall(r'https?://[^\s\)]+', line)
            if urls:
                video_url = urls[0]
            break

    word_count = len(content.split())
    duration = max(1, word_count // 200)

    return LessonData(
        title=title,
        content=content,
        type=lesson_type,
        order=order,
        duration_minutes=duration,
        video_url=video_url,
    )
