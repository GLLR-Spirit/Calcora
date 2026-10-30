"""Deterministic exercise generation for Calcora's average topics."""
from __future__ import annotations

import random
from dataclasses import asdict, dataclass
from decimal import Decimal
from typing import Literal

Topic = Literal["simple_average", "weighted_average"]
Difficulty = Literal["easy", "medium", "hard"]

@dataclass(frozen=True)
class Exercise:
    id: str
    topic: Topic
    difficulty: Difficulty
    prompt: str
    correction: str
    answer: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


def _decimal_text(value: Decimal) -> str:
    text = format(value.normalize(), "f")
    return text.rstrip("0").rstrip(".") if "." in text else text


def generate_exercises(
    count: int = 5,
    topic: Topic = "simple_average",
    difficulty: Difficulty = "easy",
    seed: int | None = None,
) -> list[Exercise]:
    """Generate reproducible exercises and worked corrections."""
    if isinstance(count, bool) or not isinstance(count, int) or not 1 <= count <= 100:
        raise ValueError("count must be an integer between 1 and 100")
    if topic not in ("simple_average", "weighted_average"):
        raise ValueError("unsupported topic")
    if difficulty not in ("easy", "medium", "hard"):
        raise ValueError("unsupported difficulty")

    rng = random.Random(seed)
    limits = {"easy": (2, 20), "medium": (10, 80), "hard": (20, 200)}
    low, high = limits[difficulty]
    exercises: list[Exercise] = []

    for index in range(1, count + 1):
        size = rng.randint(3, 4 if difficulty == "easy" else 6)
        values = [rng.randint(low, high) for _ in range(size)]
        if topic == "simple_average":
            result = sum((Decimal(value) for value in values), Decimal(0)) / len(values)
            values_text = " ; ".join(map(str, values))
            prompt = f"Calculez la moyenne simple des valeurs suivantes : {values_text}."
            correction = (
                f"Moyenne = ({' + '.join(map(str, values))}) / {len(values)}"
                f" = {_decimal_text(result)}."
            )
        else:
            weights = [rng.randint(1, 5 if difficulty == "easy" else 10) for _ in values]
            numerator = sum(
                (
                    Decimal(value) * Decimal(weight)
                    for value, weight in zip(values, weights, strict=True)
                ),
                Decimal(0),
            )
            denominator = sum(weights)
            result = numerator / Decimal(denominator)
            pairs = " ; ".join(
                f"{value} (coefficient {weight})"
                for value, weight in zip(values, weights, strict=True)
            )
            prompt = f"Calculez la moyenne pondérée : {pairs}."
            products = " + ".join(
                f"{value} × {weight}" for value, weight in zip(values, weights, strict=True)
            )
            correction = (
                f"Moyenne pondérée = ({products}) / ({' + '.join(map(str, weights))})"
                f" = {_decimal_text(result)}."
            )
        exercises.append(
            Exercise(
                id=f"{topic}-{difficulty}-{index:03d}",
                topic=topic,
                difficulty=difficulty,
                prompt=prompt,
                correction=correction,
                answer=_decimal_text(result),
            )
        )
    return exercises
