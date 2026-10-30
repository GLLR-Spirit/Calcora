# Calcora Python Core

This directory contains development-time Python utilities for Calcora. It does not
replace the static HTML, CSS and JavaScript application and does not add a runtime
server requirement.

## Requirements

- Python 3.12 or newer
- pip

## Install

From the repository root:

```bash
python -m pip install -r requirements-dev.txt
```

## Run checks

```bash
ruff check python tests/python
pytest tests/python -v
```

## Current modules

- `calcora.mathematics`: reusable weighted-average calculation.
- `calcora.validators`: structural validation of education-profile metadata.

The validator does not certify the official correctness or applicability of a
grading rule. A profile may only be labelled verified after its source and
applicability have been checked by a human against the relevant authority.

Python modules run in development and CI. GitHub Pages does not execute Python.
Future visitor-facing data should be generated as static assets and consumed by
the existing JavaScript application.
