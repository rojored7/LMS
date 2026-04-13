from pathlib import Path

from app.scripts.parsers.types import ModuleData
from app.scripts.parsers.lesson_parser import parse_lesson_file
from app.scripts.parsers.quiz_parser import parse_quiz_file
from app.scripts.parsers.lab_parser import parse_lab_file
from app.scripts.parsers.project_parser import parse_project_file


def parse_module_directory(mod_dir: Path, order: int = 0) -> ModuleData:
    title = mod_dir.name
    num_prefix = title.split("_")[0] if "_" in title else ""
    if num_prefix.isdigit():
        title = "_".join(title.split("_")[1:])
    title = title.replace("_", " ").replace("-", " ").title()

    readme = mod_dir / "README.md"
    description = ""
    if readme.exists():
        content = readme.read_text(encoding="utf-8")
        lines = content.strip().split("\n")
        if lines and lines[0].startswith("#"):
            title = lines[0].lstrip("#").strip()
        desc_lines = [l for l in lines[1:] if l.strip() and not l.startswith("#")]
        if desc_lines:
            description = "\n".join(desc_lines[:5])

    module = ModuleData(title=title, description=description, order=order)

    md_files = sorted([f for f in mod_dir.iterdir() if f.is_file() and f.suffix == ".md" and f.name != "README.md"])

    for idx, md_file in enumerate(md_files):
        name_lower = md_file.stem.lower()

        if "quiz" in name_lower or "evaluacion" in name_lower:
            quiz = parse_quiz_file(md_file)
            if quiz:
                module.quizzes.append(quiz)
        elif "lab" in name_lower or "laboratorio" in name_lower or "practica" in name_lower:
            lab = parse_lab_file(md_file)
            if lab:
                module.labs.append(lab)
        elif "proyecto" in name_lower or "project" in name_lower:
            project = parse_project_file(md_file)
            if project:
                module.projects.append(project)
        else:
            lesson = parse_lesson_file(md_file, order=idx)
            module.lessons.append(lesson)

    return module
