"""Dependency-free descriptive statistics for finite numeric datasets."""

from collections import Counter
from math import sqrt
from statistics import median
from typing import Iterable


def describe(values: Iterable[int | float]) -> dict[str, object]:
    """Return a stable JSON-friendly descriptive summary using population variance."""
    data = [float(value) for value in values]
    if not data:
        raise ValueError("values must contain at least one number")
    if any(not _is_finite(value) for value in data):
        raise ValueError("values must all be finite numbers")

    ordered = sorted(data)
    count = len(ordered)
    mean = sum(ordered) / count
    frequencies = Counter(ordered)
    highest_frequency = max(frequencies.values())
    modes = sorted(value for value, frequency in frequencies.items() if frequency == highest_frequency)
    lower = ordered[: count // 2]
    upper = ordered[(count + 1) // 2 :]
    return {
        "count": count,
        "minimum": ordered[0],
        "maximum": ordered[-1],
        "range": ordered[-1] - ordered[0],
        "mean": mean,
        "median": float(median(ordered)),
        "modes": modes,
        "mode_frequency": highest_frequency,
        "variance_population": sum((value - mean) ** 2 for value in ordered) / count,
        "standard_deviation_population": sqrt(
            sum((value - mean) ** 2 for value in ordered) / count
        ),
        "quartiles": {
            "q1": float(median(lower)) if lower else ordered[0],
            "q2": float(median(ordered)),
            "q3": float(median(upper)) if upper else ordered[-1],
        },
    }


def _is_finite(value: float) -> bool:
    return value == value and abs(value) != float("inf")
