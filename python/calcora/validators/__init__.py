"""Validation helpers for Calcora static data."""

from .education_profiles import validate_education_profile
from .json_data import load_json, validate_json_object

__all__ = [
    "load_json",
    "validate_education_profile",
    "validate_json_object",
]
