"""Build a validated, static education-profile catalog for publication."""

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from calcora.analytics import describe
from calcora.validators import validate_education_profile
from calcora.validators.json_data import load_json, validate_json_object


def build_publication_resource(source: dict[str, Any]) -> dict[str, Any]:
    errors = validate_json_object(source, required_keys={"schema_version", "profiles"})
    if errors:
        raise ValueError("; ".join(errors))
    if source["schema_version"] != 1:
        raise ValueError("schema_version must be 1")
    profiles = source["profiles"]
    if not isinstance(profiles, list) or not profiles:
        raise ValueError("profiles must be a non-empty list")

    profile_errors: list[str] = []
    ids: set[str] = set()
    statuses: list[str] = []
    for index, profile in enumerate(profiles):
        if not isinstance(profile, dict):
            profile_errors.append(f"profiles[{index}] must be an object")
            continue
        profile_id = profile.get("id")
        if not isinstance(profile_id, str) or not profile_id.strip():
            profile_errors.append(f"profiles[{index}].id must be a non-empty string")
        elif profile_id in ids:
            profile_errors.append(f"profiles[{index}].id must be unique")
        else:
            ids.add(profile_id)
        profile_errors.extend(
            f"profiles[{index}]: {error}" for error in validate_education_profile(profile)
        )
        if profile.get("status") in {"draft", "verified"}:
            statuses.append(profile["status"])
    if profile_errors:
        raise ValueError("; ".join(profile_errors))

    return {
        "schema_version": 1,
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "source": "Calcora education profile catalog",
        "publication_note": (
            "Structural metadata only. Draft profiles and unverified academic rules "
            "must not be presented as official."
        ),
        "statistics": {
            "profile_count": len(profiles),
            "status_counts": {
                status: statuses.count(status) for status in ("draft", "verified")
            },
            "subject_count": sum(len(profile.get("subjects", [])) for profile in profiles),
        },
        "profiles": profiles,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate and export Calcora profile data.")
    parser.add_argument("--input", type=Path, required=True, help="Source profile JSON file.")
    parser.add_argument("--output", type=Path, required=True, help="Publication JSON path.")
    args = parser.parse_args()
    resource = build_publication_resource(load_json(args.input))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(resource, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Published resource: {args.output} ({resource['statistics']['profile_count']} profiles)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
