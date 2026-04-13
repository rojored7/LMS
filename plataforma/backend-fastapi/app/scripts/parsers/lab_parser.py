import re
from pathlib import Path

from app.scripts.parsers.types import LabData


def parse_lab_file(filepath: Path) -> LabData | None:
    content = filepath.read_text(encoding="utf-8")
    lines = content.strip().split("\n")

    title = filepath.stem.replace("_", " ").replace("-", " ").title()
    if lines and lines[0].startswith("#"):
        title = lines[0].lstrip("#").strip()

    description = ""
    instructions = ""
    starter_code = ""
    solution_code = ""
    test_code = ""
    language = "python"

    in_code_block = False
    code_block_type = ""
    code_buffer: list[str] = []
    section = "description"

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("```") and not in_code_block:
            in_code_block = True
            lang_hint = stripped[3:].strip().lower()
            if lang_hint in ("python", "javascript", "bash", "js", "node"):
                language = "javascript" if lang_hint in ("js", "node") else lang_hint
            code_buffer = []

            if "solucion" in section or "solution" in section:
                code_block_type = "solution"
            elif "test" in section:
                code_block_type = "test"
            elif "starter" in section or "inicial" in section:
                code_block_type = "starter"
            else:
                code_block_type = "starter" if not starter_code else "solution"
            continue

        if stripped == "```" and in_code_block:
            in_code_block = False
            code_content = "\n".join(code_buffer)
            if code_block_type == "solution":
                solution_code = code_content
            elif code_block_type == "test":
                test_code = code_content
            else:
                starter_code = code_content
            continue

        if in_code_block:
            code_buffer.append(line)
            continue

        lower = stripped.lower()
        if lower.startswith("## instrucciones") or lower.startswith("## instructions"):
            section = "instructions"
        elif lower.startswith("## solucion") or lower.startswith("## solution"):
            section = "solution"
        elif lower.startswith("## test") or lower.startswith("## prueba"):
            section = "test"
        elif lower.startswith("## codigo inicial") or lower.startswith("## starter"):
            section = "starter"
        elif stripped.startswith("##"):
            section = stripped[2:].strip().lower()

        if section == "description":
            description += line + "\n"
        elif section == "instructions":
            instructions += line + "\n"

    if not description.strip():
        description = title

    return LabData(
        title=title,
        description=description.strip(),
        instructions=instructions.strip(),
        starter_code=starter_code,
        solution_code=solution_code,
        test_code=test_code,
        language=language,
    )
