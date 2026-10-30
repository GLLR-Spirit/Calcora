import json
from decimal import Decimal
from pathlib import Path

import pytest
from calcora.mathematics import simple_average, weighted_average

FIXTURES = Path(__file__).parents[1] / "fixtures" / "average-cases.json"


def test_simple_average_uses_decimal_arithmetic() -> None:
    assert simple_average(["10.5", "11.5"]) == Decimal("11")


def test_simple_average_accepts_integer_and_float_inputs() -> None:
    assert simple_average([10, 20.0, 30]) == Decimal(20)


def test_simple_average_rejects_empty_input() -> None:
    with pytest.raises(ValueError, match="At least one"):
        simple_average([])


@pytest.mark.parametrize("value", ["not-a-number", "NaN", "Infinity", "-Infinity"])
def test_simple_average_rejects_invalid_or_non_finite_values(value: str) -> None:
    with pytest.raises(ValueError):
        simple_average([value])


def test_weighted_average_uses_decimal_arithmetic() -> None:
    assert weighted_average([("12", "2"), ("14", "3")]) == Decimal("13.2")


def test_weighted_average_accepts_integer_and_float_inputs() -> None:
    assert weighted_average([(10, 1), (20.0, 1)]) == Decimal(15)


def test_weighted_average_rejects_empty_input() -> None:
    with pytest.raises(ValueError, match="At least one"):
        weighted_average([])


@pytest.mark.parametrize("weight", [0, -1, "0", "-2"])
def test_weighted_average_rejects_non_positive_weights(weight: int | str) -> None:
    with pytest.raises(ValueError, match="greater than zero"):
        weighted_average([(10, weight)])


@pytest.mark.parametrize("value", ["NaN", "Infinity", "-Infinity"])
def test_weighted_average_rejects_non_finite_values(value: str) -> None:
    with pytest.raises(ValueError, match="finite"):
        weighted_average([(value, 1)])


def test_weighted_average_rejects_invalid_numeric_input() -> None:
    with pytest.raises(ValueError, match="valid number"):
        weighted_average([("not-a-number", 1)])


def test_python_results_match_shared_cross_language_fixtures() -> None:
    cases = json.loads(FIXTURES.read_text(encoding="utf-8"))
    for case in cases:
        if case["expected"] is None:
            with pytest.raises(ValueError):
                if case["kind"] == "simple":
                    simple_average(case["values"])
                else:
                    weighted_average(list(zip(case["values"], case["weights"], strict=True)))
            continue
        if case["kind"] == "simple":
            actual = simple_average(case["values"])
        else:
            actual = weighted_average(list(zip(case["values"], case["weights"], strict=True)))
        assert actual == Decimal(case["expected"]), case["name"]
