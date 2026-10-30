"""Command-line interface for generating Calcora exercise resources."""
from __future__ import annotations
import argparse
from . import export_exercises_pdf, export_question_bank, generate_exercises


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate Calcora educational resources.")
    parser.add_argument("--topic", choices=("simple_average", "weighted_average"), default="simple_average")
    parser.add_argument("--difficulty", choices=("easy", "medium", "hard"), default="easy")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--format", choices=("json", "pdf"), default="json")
    parser.add_argument("--output", required=True, help="Output .json or .pdf path")
    parser.add_argument("--without-corrections", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    exercises = generate_exercises(
        count=args.count, topic=args.topic, difficulty=args.difficulty, seed=args.seed
    )
    if args.format == "json":
        if not args.output.lower().endswith(".json"):
            raise SystemExit("JSON format requires an .json output path")
        export_question_bank(exercises, args.output)
    else:
        if not args.output.lower().endswith(".pdf"):
            raise SystemExit("PDF format requires an .pdf output path")
        export_exercises_pdf(
            exercises, args.output, include_corrections=not args.without_corrections
        )
    print(f"{len(exercises)} exercises exported to {args.output}")
    return 0
