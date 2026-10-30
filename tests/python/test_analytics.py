import pytest

from calcora.analytics import describe


def test_descriptive_statistics_for_even_dataset() -> None:
    result = describe([1, 2, 2, 4])
    assert result["count"] == 4
    assert result["minimum"] == 1
    assert result["maximum"] == 4
    assert result["range"] == 3
    assert result["mean"] == 2.25
    assert result["median"] == 2.0
    assert result["modes"] == [2.0]
    assert result["variance_population"] == 1.1875
    assert result["quartiles"] == {"q1": 1.5, "q2": 2.0, "q3": 3.0}


def test_descriptive_statistics_for_single_value() -> None:
    result = describe([7])
    assert result["mean"] == result["median"] == 7
    assert result["standard_deviation_population"] == 0


@pytest.mark.parametrize("values", [[], [float("nan")], [float("inf")]])
def test_descriptive_statistics_reject_invalid_data(values: list[float]) -> None:
    with pytest.raises(ValueError):
        describe(values)
