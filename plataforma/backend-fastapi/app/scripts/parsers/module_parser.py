import json
from pathlib import Path

from app.scripts.parsers.types import ParsedModule


def parse_module(module_dir: Path) -> ParsedModule:
    module_json = module_dir / "module.json"
    if module_json.exists():
        with open(module_json) as f:
            config = json.load(f)
        order = config.get("order", _extract_order(module_dir.name))
        return ParsedModule(
            order=order,
            title=config.get("title", module_dir.name),
            description=config.get("description", ""),
            duration=config.get("duration", 60),
        )

    order = _extract_order(module_dir.name)
    title = module_dir.name
    parts = title.split("_", 1)
    if len(parts) > 1 and parts[0].isdigit():
        title = parts[1].replace("_", " ").title()

    return ParsedModule(order=order, title=title.upper())


def _extract_order(name: str) -> int:
    parts = name.split("_")
    for p in parts:
        cleaned = p.lstrip("0")
        if cleaned.isdigit():
            return int(cleaned)
    return 1
