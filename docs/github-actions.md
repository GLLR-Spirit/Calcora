# GitHub Actions automation

Calcora keeps its production site static. GitHub Actions runs Python and JavaScript
checks in CI; Python is not deployed as a web server.

## Python quality workflow

`.github/workflows/python-quality.yml` runs on:
- Pull requests targeting `main`, `feature/python-core` or `feature/data-statistics`.
- Pushes to the main development branches, including `feature/github-automation`.
- Manual dispatch from the Actions tab.

It installs the development dependencies, runs Ruff, and executes the complete
Python test suite on Python 3.12. Pytest writes a JUnit XML report and Ruff writes
a JSON report under `reports/`. Both are uploaded as the
`calcora-python-quality-reports` artifact, including when a test step fails.
A concise test summary is also added to the workflow run summary.

## JavaScript and browser regression workflow

`.github/workflows/quality.yml` runs alongside the Python checks for pull requests
targeting the supported integration branches. It validates JavaScript syntax,
runs the Node regression suite, and performs the existing Playwright/Chromium
browser audit. Browser screenshots are uploaded as an artifact.

## Existing workflow compatibility

- `pages.yml` remains restricted to pushes to `main` and manual deployment.
- `lighthouse-baseline.yml` retains its manual and path-filtered pull-request
  triggers.
- CI workflows use read-only repository permissions.
- Concurrency groups cancel obsolete runs for the same pull request or branch.
- CI artifacts expire after 14 days; no generated reports are committed to the
  static website.

## Local equivalents

```bash
ruff check python tests/python
pytest tests/python -v --junitxml=reports/python-tests.xml
node --test tests/*.test.cjs
```
