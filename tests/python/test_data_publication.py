import pytest


from calcora.data.publish import build_publication_resource
from calcora.validators.json_data import load_json, validate_json_object


def sample() -> dict:
    return {
        "schema_version": 1,
        "profiles": [
            {
                "id": "math",
                "name": "Mathematics",
                "status": "draft",
                "academic_year": "2026-2027",
                "subjects": [{"name": "Algebra", "coefficient": 2}],
            }
        ],
    }


def test_publication_resource_contains_statistics_and_keeps_draft_status() -> None:
    result = build_publication_resource(sample())
    assert result["statistics"] == {
        "profile_count": 1,
        "status_counts": {"draft": 1, "verified": 0},
        "subject_count": 1,
    }
    assert result["profiles"][0]["status"] == "draft"
    assert "not be presented as official" in result["publication_note"]


def test_duplicate_profile_ids_are_rejected() -> None:
    data = sample()
    data["profiles"].append(dict(data["profiles"][0]))
    with pytest.raises(ValueError, match="must be unique"):
        build_publication_resource(data)


def test_invalid_profile_is_rejected() -> None:
    data = sample()
    data["profiles"][0]["subjects"][0]["coefficient"] = 0
    with pytest.raises(ValueError, match="positive finite"):
        build_publication_resource(data)


def test_json_structure_requires_keys_and_rejects_non_finite_numbers() -> None:
    assert "missing required key: profiles" in validate_json_object(
        {"schema_version": 1}, required_keys={"profiles"}
    )
    assert any(
        "finite number" in error
        for error in validate_json_object({"value": float("nan")})
    )


def test_json_loader_rejects_duplicate_keys(tmp_path) -> None:
    path = tmp_path / "duplicate.json"
    path.write_text('{"profiles": [], "profiles": []}', encoding="utf-8")
    with pytest.raises(ValueError, match="duplicate JSON key"):
        load_json(path)


def test_repository_profile_catalog_is_valid_json() -> None:
    from pathlib import Path

    catalog = Path("data/education-profiles.json")
    parsed = load_json(catalog)
    assert build_publication_resource(parsed)["statistics"]["profile_count"] == 5
