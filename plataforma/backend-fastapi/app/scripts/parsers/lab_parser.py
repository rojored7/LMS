import json
from pathlib import Path

from app.scripts.parsers.types import ParsedLab


def parse_labs(module_dir: Path) -> list[ParsedLab]:
    labs_dir = module_dir / "labs"
    if not labs_dir.exists():
        return []

    labs = []
    for lf in sorted(labs_dir.glob("*.json")):
        try:
            with open(lf) as f:
                data = json.load(f)

            labs.append(
                ParsedLab(
                    title=data.get("title", lf.stem),
                    description=data.get("description", ""),
                    language=data.get("language", "python"),
                    starter_code=data.get("starter_code", data.get("starterCode", "")),
                    solution=data.get("solution", ""),
                    tests=data.get("tests", {}),
                    hints=data.get("hints"),
                )
            )
        except (json.JSONDecodeError, KeyError):
            continue

    return labs
