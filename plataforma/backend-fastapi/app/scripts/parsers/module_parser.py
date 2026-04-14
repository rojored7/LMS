import json
from pathlib import Path

from app.scripts.parsers.types import ParsedModule


def parse_module(module_dir: Path) -> ParsedModule:
    # Try module.json
    module_json = module_dir / "module.json"
    if module_json.exists():
        with open(module_json, encoding="utf-8") as f:
            config = json.load(f)
        order = config.get("order", _extract_order(module_dir.name))
        return ParsedModule(
            order=order,
            title=config.get("title", module_dir.name),
            description=config.get("description", ""),
            duration=config.get("duration", 60),
        )

    # Try module.yaml / module.yml
    for yaml_name in ["module.yaml", "module.yml"]:
        yaml_path = module_dir / yaml_name
        if yaml_path.exists():
            try:
                import yaml
                with open(yaml_path, encoding="utf-8") as f:
                    config = yaml.safe_load(f)
                if config and isinstance(config, dict):
                    order = config.get("order", _extract_order(module_dir.name))
                    duration = config.get("duration", 60)
                    if not duration and config.get("duration_hours"):
                        duration = int(config["duration_hours"]) * 60
                    return ParsedModule(
                        order=order,
                        title=config.get("title", module_dir.name),
                        description=config.get("description", ""),
                        duration=duration,
                    )
            except Exception:
                continue

    # Fallback: parse from directory name + README.md
    order = _extract_order(module_dir.name)
    title = module_dir.name
    parts = title.split("_", 1)
    if len(parts) > 1 and parts[0].isdigit():
        title = parts[1].replace("_", " ").title()

    description = ""
    readme = module_dir / "README.md"
    if readme.exists():
        try:
            lines = readme.read_text(encoding="utf-8", errors="replace").splitlines()
            if lines and lines[0].startswith("#"):
                title = lines[0].lstrip("# ").strip()
            desc_lines = [l for l in lines[1:] if l.strip() and not l.startswith("#")]
            if desc_lines:
                description = desc_lines[0].strip()[:300]
        except Exception:
            pass

    return ParsedModule(order=order, title=title, description=description)


def _extract_order(name: str) -> int:
    parts = name.split("_")
    for p in parts:
        cleaned = p.lstrip("0")
        if cleaned.isdigit():
            return int(cleaned)
    return 1
