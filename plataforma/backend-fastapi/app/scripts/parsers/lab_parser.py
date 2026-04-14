import json
from pathlib import Path

from app.scripts.parsers.types import ParsedLab


def parse_labs(module_dir: Path) -> list[ParsedLab]:
    labs_dir = None
    for dirname in ["labs", "laboratorios"]:
        candidate = module_dir / dirname
        if candidate.exists() and candidate.is_dir():
            labs_dir = candidate
            break
    if labs_dir is None:
        return []

    labs = []
    for lf in sorted(labs_dir.glob("*.json")):
        try:
            with open(lf) as f:
                data = json.load(f)

            # Support both formats:
            # Format A (code-based): has starter_code, solution, tests, hints directly
            # Format B (step-based): has steps[] with code blocks
            # Format C (content_file): has content_file reference to a .md file
            starter_code = data.get("starter_code", data.get("starterCode", ""))
            solution = data.get("solution", "")
            tests = data.get("tests", {})
            hints = data.get("hints")

            steps = data.get("steps", [])
            exercises = data.get("exercises", [])
            content_file = data.get("content_file", "")
            setup = data.get("setup", {})
            language = data.get("language", "python")
            comment_char = "#" if language not in ("javascript", "typescript") else "//"

            # Format B: Build starter_code from step code blocks
            if steps and not starter_code:
                code_blocks = []
                for step in steps:
                    if not isinstance(step, dict):
                        continue
                    title = step.get("title", f"Paso {step.get('order', '')}")
                    code = step.get("code", "")
                    if code:
                        code_blocks.append(f"{comment_char} --- {title} ---\n{code}")
                starter_code = "\n\n".join(code_blocks)

            # Format C: Try to read content_file as starter_code (with path traversal guard)
            if content_file and not starter_code:
                content_path = (lf.parent / content_file).resolve()
                base_dir = lf.parent.resolve()
                if content_path.exists() and content_path.is_relative_to(base_dir):
                    starter_code = content_path.read_text(encoding="utf-8")

            # If still no starter_code, build from setup instructions + description
            if not starter_code:
                parts = []
                if setup and isinstance(setup, dict):
                    instructions = setup.get("instructions", "")
                    if instructions:
                        parts.append(f"{comment_char} Setup: {instructions}")
                    deps = setup.get("dependencies", [])
                    if deps:
                        parts.append(f"{comment_char} Dependencias: {', '.join(deps)}")
                desc = data.get("description", "")
                if desc:
                    parts.append(f"{comment_char} {desc}")
                if exercises:
                    parts.append(f"\n{comment_char} === Ejercicios ===")
                    for i, ex in enumerate(exercises, 1):
                        parts.append(f"{comment_char} {i}. {ex}")
                starter_code = "\n".join(parts) if parts else ""

            # Build solution from expected_output
            if steps and not solution:
                output_blocks = []
                for step in steps:
                    if not isinstance(step, dict):
                        continue
                    expected = step.get("expected_output", step.get("explanation", ""))
                    if expected:
                        output_blocks.append(f"{comment_char} {step.get('title', '')}\n{expected}")
                solution = "\n\n".join(output_blocks) if output_blocks else ""

            # Store steps as tests JSON for reference
            if steps and not tests:
                tests = {"steps": steps}

            # Build hints from objectives + prerequisites + exercises
            if not hints:
                objectives = data.get("objectives", [])
                prerequisites = data.get("prerequisites", [])
                combined = objectives + prerequisites
                if exercises:
                    combined.extend(exercises)
                if combined:
                    hints = combined

            labs.append(
                ParsedLab(
                    title=data.get("title", lf.stem),
                    description=data.get("description", ""),
                    language=language,
                    starter_code=starter_code,
                    solution=solution,
                    tests=tests if tests else {},
                    hints=hints,
                )
            )
        except Exception:
            continue

    # Also parse lab subdirectories (lab_01_name/README.md format)
    for subdir in sorted(labs_dir.iterdir()):
        if not subdir.is_dir():
            continue
        readme = subdir / "README.md"
        if not readme.exists():
            continue

        try:
            content = readme.read_text(encoding="utf-8", errors="replace")
            lines = content.splitlines()

            title = subdir.name.replace("_", " ").replace("-", " ").title()
            if lines and lines[0].startswith("#"):
                title = lines[0].lstrip("# ").strip()

            description = ""
            language = "python"
            hints_list = []

            # Extract metadata and content
            in_objectives = False
            for line in lines[1:]:
                low = line.lower().strip()
                if low.startswith("**duracion**") or low.startswith("**dificultad**"):
                    continue
                if "python" in low and ("lenguaje" in low or "language" in low):
                    language = "python"
                elif "bash" in low or "shell" in low:
                    language = "bash"

                if "## objetivos" in low or "## objetivo" in low:
                    in_objectives = True
                    continue
                if in_objectives and line.startswith("- "):
                    hints_list.append(line.lstrip("- ").strip())
                elif in_objectives and line.startswith("#"):
                    in_objectives = False

                if not description and line.strip() and not line.startswith("#") and not line.startswith("**"):
                    description = line.strip()

            # Extract code blocks as starter_code
            code_blocks = []
            in_code = False
            current_block = []
            for line in lines:
                if line.startswith("```") and not in_code:
                    in_code = True
                    lang = line[3:].strip()
                    if lang:
                        language = lang
                    continue
                if line.startswith("```") and in_code:
                    in_code = False
                    if current_block:
                        code_blocks.append("\n".join(current_block))
                        current_block = []
                    continue
                if in_code:
                    current_block.append(line)

            starter_code = "\n\n".join(code_blocks) if code_blocks else content

            labs.append(
                ParsedLab(
                    title=title,
                    description=description,
                    language=language,
                    starter_code=starter_code,
                    solution="",
                    tests={},
                    hints=hints_list if hints_list else None,
                )
            )
        except Exception:
            continue

    return labs
