"""
Import a course from Markdown directory structure.
Run: python -m app.scripts.import_course <course_dir>
"""
import asyncio
import sys
from pathlib import Path

from app.database import get_session_factory
from app.scripts.parsers.course_parser import parse_course_directory
from app.scripts.importers.db_importer import import_course_to_db


async def main(course_dir: str):
    path = Path(course_dir)
    if not path.is_dir():
        print(f"Error: {course_dir} is not a directory")
        sys.exit(1)

    print(f"Parsing course from: {path}")
    course_data = parse_course_directory(path)

    print(f"Course: {course_data.title}")
    print(f"Modules: {len(course_data.modules)}")
    total_lessons = sum(len(m.lessons) for m in course_data.modules)
    print(f"Total lessons: {total_lessons}")

    session_factory = get_session_factory()
    async with session_factory() as db:
        try:
            course_id = await import_course_to_db(db, course_data)
            await db.commit()
            print(f"Course imported successfully. ID: {course_id}")
        except Exception as e:
            await db.rollback()
            print(f"Import failed: {e}")
            raise


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.scripts.import_course <course_directory>")
        sys.exit(1)
    asyncio.run(main(sys.argv[1]))
