from decimal import Decimal

import pytest

from calcora.mathematics import weighted_average


def test_weighted_average_uses_decimal_arithmetic() -> None:
    assert weighted_average([("12", "2"), ("14", "3")]) == Decimal("13.2")


def test_weighted_average_accepts_integer_and_float_inputs() -> None:
    assert weighted_average([(10, 1), (20.0, 1)]) == Decimal("15")


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
    with pytest.raises(ValueError, match="valid numbers"):
        weighted_average([("not-a-number", 1)])
