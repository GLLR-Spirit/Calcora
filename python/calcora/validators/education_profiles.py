"""Structural validation for education-profile data.

These checks validate metadata and data shape only. They do not certify the
official correctness or applicability of an education rule.
"""

from collections.abc import Mapping
from datetime import date
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse


def validate_education_profile(profile: Mapping[str, object]) -> list[str]:
    """Return validation errors for a profile; an empty list means structurally valid."""
    errors: list[str] = []

    name = profile.get("name")
    if not isinstance(name, str) or not name.strip():
        errors.append("name must be a non-empty string")

    status = profile.get("status")
    if status not in {"draft", "verified"}:
        errors.append("status must be 'draft' or 'verified'")

    academic_year = profile.get("academic_year")
    if not isinstance(academic_year, str) or not academic_year.strip():
        errors.append("academic_year must be provided")

    if status == "verified":
        source_url = profile.get("source_url")
        parsed = urlparse(source_url) if isinstance(source_url, str) else None
        if not parsed or parsed.scheme != "https" or not parsed.netloc:
            errors.append("verified profiles require an HTTPS source_url")

        reviewed_on = profile.get("reviewed_on")
        if not isinstance(reviewed_on, str):
            errors.append("verified profiles require reviewed_on in YYYY-MM-DD format")
        else:
            try:
                date.fromisoformat(reviewed_on)
            except ValueError:
                errors.append(
                    "verified profiles require reviewed_on in YYYY-MM-DD format"
                )

    subjects = profile.get("subjects", [])
    if not isinstance(subjects, list):
        errors.append("subjects must be a list")
    else:
        for index, subject in enumerate(subjects):
            if not isinstance(subject, Mapping):
                errors.append(f"subjects[{index}] must be an object")
                continue

            subject_name = subject.get("name")
            if not isinstance(subject_name, str) or not subject_name.strip():
                errors.append(f"subjects[{index}].name must be a non-empty string")

            try:
                coefficient = Decimal(str(subject.get("coefficient")))
                if not coefficient.is_finite() or coefficient <= 0:
                    raise InvalidOperation
            except (InvalidOperation, ValueError):
                errors.append(
                    f"subjects[{index}].coefficient must be a positive finite number"
                )

    return errors
