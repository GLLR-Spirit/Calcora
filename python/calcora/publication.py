"""Build the JSON and PDF resources consumed by Calcora's static website."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from typing import Any
from calcora.data.publish import build_publication_resource
from calcora.pedagogy import export_exercises_pdf, export_question_bank, generate_exercises
from calcora.validators.json_data import load_json


def build_public_resources(output_dir: str | Path, profiles_path: str | Path) -> dict[str, Any]:
    """Generate a validated profile catalog, two question banks and two worksheets."""
    root = Path(output_dir)
    catalog = build_publication_resource(load_json(profiles_path))
    catalog_path = root / "data/public/education-profiles.json"
    catalog_path.parent.mkdir(parents=True, exist_ok=True)
    catalog_path.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    resources = (
        ("simple_average", "easy", "simple-average-easy"),
        ("weighted_average", "medium", "weighted-average-medium"),
    )
    for topic, difficulty, slug in resources:
        exercises = generate_exercises(count=10, topic=topic, difficulty=difficulty, seed=20261031)
        export_question_bank(
            exercises, root / "data/public/question-banks" / f"{slug}.json"
        )
        pdf_name = slug.replace("-easy", "").replace("-medium", "")
        export_exercises_pdf(
            exercises, root / "resources" / f"{pdf_name}-practice-fr.pdf",
            include_corrections=True,
        )
    return {
        "catalog": str(catalog_path), "question_banks": 2, "worksheets": 2,
        "profile_count": catalog["statistics"]["profile_count"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build Calcora's public static learning resources."
    )
    parser.add_argument("--output-dir", type=Path, default=Path("."))
    parser.add_argument("--profiles", type=Path, default=Path("data/education-profiles.json"))
    args = parser.parse_args()
    print(json.dumps(build_public_resources(args.output_dir, args.profiles)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
