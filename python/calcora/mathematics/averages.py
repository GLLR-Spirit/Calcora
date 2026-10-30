"""Validated mathematical aggregation helpers."""

from collections.abc import Iterable
from decimal import Decimal, InvalidOperation


def weighted_average(
    values: Iterable[tuple[int | float | str | Decimal, int | float | str | Decimal]],
) -> Decimal:
    """Return a weighted average using decimal arithmetic.

    Each item is a (value, weight) pair. Empty input, non-finite values and
    non-positive weights are rejected instead of silently producing a result.
    """
    numerator = Decimal("0")
    denominator = Decimal("0")
    count = 0

    for value, weight in values:
        try:
            mark = Decimal(str(value))
            coefficient = Decimal(str(weight))
        except (InvalidOperation, ValueError) as exc:
            raise ValueError("Values and weights must be valid numbers.") from exc

        if not mark.is_finite() or not coefficient.is_finite():
            raise ValueError("Values and weights must be finite.")
        if coefficient <= 0:
            raise ValueError("Weights must be greater than zero.")

        numerator += mark * coefficient
        denominator += coefficient
        count += 1

    if count == 0:
        raise ValueError("At least one value and weight pair is required.")

    return numerator / denominator
