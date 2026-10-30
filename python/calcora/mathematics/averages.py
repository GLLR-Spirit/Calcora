"""Validated mathematical aggregation helpers."""

from collections.abc import Iterable
from decimal import Decimal, InvalidOperation

Number = int | float | str | Decimal


def _to_decimal(value: Number, *, label: str) -> Decimal:
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"{label} must be a valid number.") from exc
    if not result.is_finite():
        raise ValueError(f"{label} must be finite.")
    return result


def simple_average(values: Iterable[Number]) -> Decimal:
    """Return the arithmetic mean using decimal arithmetic.

    Empty input, invalid numbers and non-finite values raise ValueError.
    """
    total = Decimal(0)
    count = 0
    for value in values:
        total += _to_decimal(value, label="Values")
        count += 1
    if count == 0:
        raise ValueError("At least one value is required.")
    return total / count


def weighted_average(values: Iterable[tuple[Number, Number]]) -> Decimal:
    """Return a weighted mean from (value, weight) pairs.

    Empty input, invalid numbers, non-finite values and non-positive weights
    are rejected instead of silently producing a result.
    """
    numerator = Decimal(0)
    denominator = Decimal(0)
    count = 0

    for value, weight in values:
        mark = _to_decimal(value, label="Values")
        coefficient = _to_decimal(weight, label="Weights")
        if coefficient <= 0:
            raise ValueError("Weights must be greater than zero.")
        numerator += mark * coefficient
        denominator += coefficient
        count += 1

    if count == 0:
        raise ValueError("At least one value and weight pair is required.")
    return numerator / denominator
