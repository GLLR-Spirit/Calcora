# Python integration

## Scope

Calcora remains a static HTML, CSS and vanilla JavaScript website hosted on GitHub
Pages. Python is introduced for development-time calculations, data validation,
content generation and CI. No Python server is required by the public website.

## Mathematical core

- simple_average(values) calculates an arithmetic mean with Decimal.
- weighted_average((value, weight), ...) calculates a weighted mean with Decimal.
- Empty collections, invalid/non-finite values and zero or negative weights are rejected.
- tests/fixtures/average-cases.json is shared by Python and JavaScript tests to
  check matching valid results and invalid-input behavior.

The Python functions are independent development utilities. They do not replace
the browser-side JavaScript calculators in this phase.

## Initial Python Core

- Python 3.12+
- pytest for automated tests
- Ruff for linting
- Decimal-based simple and weighted averages
- Structural validation of education-profile metadata

The education-profile validator checks data shape and metadata only. It does not
verify that coefficients or grading rules are officially correct. A profile
marked verified must include an HTTPS source URL, an academic year and a review
date; human source review remains mandatory.

## Install and run

    python -m pip install -r requirements-dev.txt
    ruff check python tests/python
    pytest tests/python -v
    node --test tests/*.test.cjs

## GitHub Actions

The python-quality workflow runs Python checks on pull requests targeting main,
pushes to main and the integration branch, and manual dispatch. The existing
JavaScript quality and Pages workflows remain separate and unchanged.

## Static-site boundary

GitHub Pages does not execute Python. Future visitor-facing data should be
generated as static JSON, CSV or PDF files and consumed by the existing
JavaScript frontend. Do not make site deployment depend on a long-running
Python backend.
