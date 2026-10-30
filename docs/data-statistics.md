# Data validation, statistics and publication

Phase 4 adds development-time quality controls. It does not add a Python server or
change the static GitHub Pages runtime.

## Education profiles

The catalog at `data/education-profiles.json` is a metadata inventory. Its profiles
are deliberately marked `draft`; it contains no official coefficient tables.
A profile may be marked `verified` only when its HTTPS primary source and review
date are supplied. Structural validation is not proof that an academic rule is
current, complete or applicable to a particular institution.

## Descriptive statistics

`calcora.analytics.describe(values)` returns count, minimum, maximum, range,
arithmetic mean, median, modes, population variance, population standard deviation
and quartiles. It rejects empty or non-finite datasets. Variance and standard
deviation are population measures, not sample estimates.

## JSON and translations

The JSON loader rejects duplicate keys and non-standard numeric constants.
The locale consistency test executes the existing French, English and Arabic
JavaScript dictionaries and verifies matching keys and non-empty string values.
This is a structural check; it does not judge translation quality or cultural
accuracy.

## Build a publication-ready static resource

Install development dependencies, then run:

```bash
PYTHONPATH=python python -m calcora.publication --output-dir .
```

The build creates the static files consumed by `resources.html`: the validated
profile catalog, two reproducible JSON question banks and two printable French
PDF worksheets. Generated resources are built during CI and GitHub Pages deployment;
they are not committed as source files. The profile catalog remains draft-only
until its academic sources and coefficients have been independently verified.
