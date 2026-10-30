"""Strict JSON loading and structural validation helpers."""

import json
from pathlib import Path
from typing import Any


def load_json(path: str | Path) -> Any:
    """Load UTF-8 JSON, rejecting duplicate object keys and non-standard constants."""
    def unique_object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate JSON key: {key}")
            result[key] = value
        return result

    def reject_constant(value: str) -> None:
        raise ValueError(f"non-standard JSON constant: {value}")

    try:
        return json.loads(
            Path(path).read_text(encoding="utf-8"),
            object_pairs_hook=unique_object,
            parse_constant=reject_constant,
        )
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON at line {exc.lineno}, column {exc.colno}") from exc


def validate_json_object(value: Any, *, required_keys: set[str] | None = None) -> list[str]:
    """Validate a JSON-compatible tree and optionally require root object keys."""
    errors: list[str] = []
    if not isinstance(value, dict):
        return ["root must be a JSON object"]
    if required_keys:
        for key in sorted(required_keys - value.keys()):
            errors.append(f"missing required key: {key}")

    def walk(node: Any, path: str) -> None:
        if node is None or isinstance(node, (str, bool, int)):
            return
        if isinstance(node, float):
            if node != node or abs(node) == float("inf"):
                errors.append(f"{path} must be a finite number")
            return
        if isinstance(node, list):
            for index, child in enumerate(node):
                walk(child, f"{path}[{index}]")
            return
        if isinstance(node, dict):
            for key, child in node.items():
                if not isinstance(key, str):
                    errors.append(f"{path} contains a non-string key")
                walk(child, f"{path}.{key}")
            return
        errors.append(f"{path} contains a non-JSON value")

    walk(value, "$")
    return errors
