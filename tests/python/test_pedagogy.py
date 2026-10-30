import json
import subprocess
import sys
from decimal import Decimal
import pytest
from calcora.pedagogy import export_exercises_pdf, export_question_bank, generate_exercises


def test_generation_is_reproducible() -> None:
    assert generate_exercises(count=4, seed=42) == generate_exercises(count=4, seed=42)


@pytest.mark.parametrize("topic", ["simple_average", "weighted_average"])
@pytest.mark.parametrize("difficulty", ["easy", "medium", "hard"])
def test_generated_exercises_have_numeric_answers(topic: str, difficulty: str) -> None:
    items = generate_exercises(count=8, topic=topic, difficulty=difficulty, seed=7)
    assert all(Decimal(item.answer).is_finite() for item in items)
    assert all(item.prompt and item.correction for item in items)
    assert len({item.id for item in items}) == len(items)


@pytest.mark.parametrize("count", [0, -1, 101, True, 1.5])
def test_invalid_count_is_rejected(count: object) -> None:
    with pytest.raises(ValueError):
        generate_exercises(count=count)  # type: ignore[arg-type]


def test_invalid_topic_and_difficulty_are_rejected() -> None:
    with pytest.raises(ValueError, match="topic"):
        generate_exercises(topic="unknown")  # type: ignore[arg-type]
    with pytest.raises(ValueError, match="difficulty"):
        generate_exercises(difficulty="unknown")  # type: ignore[arg-type]


def test_json_export_contains_questions_and_corrections(tmp_path) -> None:
    items = generate_exercises(count=3, topic="weighted_average", seed=3)
    output = export_question_bank(items, tmp_path / "bank" / "questions.json")
    data = json.loads(output.read_text(encoding="utf-8"))
    assert data["schema_version"] == "1.0"
    assert data["count"] == 3
    assert len(data["exercises"]) == 3
    assert all(x["prompt"] and x["correction"] and x["answer"] for x in data["exercises"])


def test_json_export_rejects_empty_bank(tmp_path) -> None:
    with pytest.raises(ValueError, match="at least one"):
        export_question_bank([], tmp_path / "empty.json")


def test_pdf_export_creates_valid_pdf_and_corrections(tmp_path) -> None:
    output = export_exercises_pdf(
        generate_exercises(count=2, seed=9), tmp_path / "worksheets" / "sheet.pdf"
    )
    assert output.read_bytes().startswith(b"%PDF-")
    assert output.stat().st_size > 500


def test_pdf_export_can_omit_corrections(tmp_path) -> None:
    output = export_exercises_pdf(
        generate_exercises(count=1, seed=10),
        tmp_path / "questions-only.pdf",
        include_corrections=False,
    )
    assert output.read_bytes().startswith(b"%PDF-")


def test_cli_exports_json(tmp_path) -> None:
    output = tmp_path / "cli-bank.json"
    result = subprocess.run(
        [sys.executable, "-m", "calcora.pedagogy", "--topic", "weighted_average",
         "--count", "2", "--seed", "11", "--format", "json", "--output", str(output)],
        check=True, capture_output=True, text=True,
    )
    assert "2 exercises exported" in result.stdout
    assert json.loads(output.read_text(encoding="utf-8"))["count"] == 2
