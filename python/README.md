# Calcora Python Core

This directory contains development-time Python utilities for Calcora. It does not
replace the static HTML, CSS and JavaScript application and does not add a runtime
server requirement.

## Requirements

- Python 3.12 or newer
- pip

## Install

From the repository root:

    python -m pip install -r requirements-dev.txt

## Run checks

    ruff check python tests/python
    pytest tests/python -v
    node --test tests/*.test.cjs

## Current modules

- calcora.mathematics: simple and weighted average calculations.
- calcora.validators: education-profile, JSON structure and duplicate-key validation.
- calcora.pedagogy: exercise generation, worked corrections, JSON banks and PDF worksheets.
- calcora.analytics: dependency-free descriptive statistics.
- calcora.data: validated static data publication.

## Generate educational resources

Generate a JSON question bank:

    python -m calcora.pedagogy --topic simple_average --difficulty easy --count 10 --seed 42 --format json --output exports/questions.json

Generate a PDF worksheet with corrections:

    python -m calcora.pedagogy --topic weighted_average --difficulty medium --count 8 --seed 42 --format pdf --output exports/worksheet.pdf

Generate the validated profile catalog for static publication:

    python -m calcora.data.publish --input data/education-profiles.json --output exports/education-profiles.json

Use `--without-corrections` to export questions only. Topics are `simple_average`
and `weighted_average`; difficulties are `easy`, `medium` and `hard`. A fixed
seed makes exercises reproducible.

The education catalog currently contains draft metadata only. Structural validation
does not certify the official correctness or applicability of a grading rule.
Generated exercises are synthetic practice material, not official exam questions,
and should be reviewed before publication.

Python modules run in development and CI. GitHub Pages does not execute Python.
Generated JSON is a static artifact that can be reviewed and then served as a file.
