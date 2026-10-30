from calcora.validators import validate_education_profile


def test_draft_profile_can_be_valid_without_official_source() -> None:
    profile = {
        "name": "Generic university profile",
        "status": "draft",
        "academic_year": "2026-2027",
        "subjects": [{"name": "Mathematics", "coefficient": 3}],
    }
    assert validate_education_profile(profile) == []


def test_verified_profile_requires_https_source_and_review_date() -> None:
    profile = {
        "name": "Reviewed profile",
        "status": "verified",
        "academic_year": "2026-2027",
        "source_url": "http://example.org/rules",
        "reviewed_on": "yesterday",
        "subjects": [],
    }
    errors = validate_education_profile(profile)
    assert "verified profiles require an HTTPS source_url" in errors
    assert "verified profiles require reviewed_on in YYYY-MM-DD format" in errors


def test_verified_profile_accepts_required_metadata_shape() -> None:
    profile = {
        "name": "Reviewed profile",
        "status": "verified",
        "academic_year": "2026-2027",
        "source_url": "https://example.org/rules",
        "reviewed_on": "2026-10-30",
        "subjects": [{"name": "Algorithms", "coefficient": "2"}],
    }
    assert validate_education_profile(profile) == []


def test_invalid_subject_coefficient_is_reported() -> None:
    profile = {
        "name": "Draft",
        "status": "draft",
        "academic_year": "2026-2027",
        "subjects": [{"name": "Physics", "coefficient": 0}],
    }
    assert "subjects[0].coefficient must be a positive finite number" in (
        validate_education_profile(profile)
    )


def test_invalid_profile_shape_is_reported() -> None:
    errors = validate_education_profile({"name": "", "status": "unknown", "subjects": "bad"})
    assert "name must be a non-empty string" in errors
    assert "status must be 'draft' or 'verified'" in errors
    assert "academic_year must be provided" in errors
    assert "subjects must be a list" in errors
