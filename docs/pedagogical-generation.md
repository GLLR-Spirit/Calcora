# Pedagogical generation

## Scope

Phase 3 adds development-time educational content generation for the two average
topics implemented in Calcora's Python mathematical core. It does not add a
Python runtime to the GitHub Pages website.

## Capabilities

- Generate reproducible simple-average and weighted-average exercises.
- Produce worked correction steps and a numeric answer for each exercise.
- Export versioned UTF-8 JSON question banks.
- Export printable A4 PDF worksheets, with or without corrections.
- Select difficulty, number of exercises and a random seed.

Generated questions are synthetic practice material. They are not official
university exam questions and must be reviewed before publication.

## Install

From the repository root:

    python -m pip install -r requirements-dev.txt

ReportLab is included in the development dependencies for PDF generation.

## Command line

Generate a JSON bank:

    python -m calcora.pedagogy --topic simple_average --difficulty easy --count 10 --seed 42 --format json --output exports/averages.json

Generate a PDF worksheet with corrections:

    python -m calcora.pedagogy --topic weighted_average --difficulty medium --count 8 --seed 42 --format pdf --output exports/weighted-averages.pdf

Generate a PDF without corrections:

    python -m calcora.pedagogy --topic simple_average --count 5 --format pdf --without-corrections --output exports/questions-only.pdf

## Python API

    from calcora.pedagogy import generate_exercises, export_question_bank, export_exercises_pdf

    exercises = generate_exercises(count=10, topic="weighted_average", difficulty="medium", seed=42)
    export_question_bank(exercises, "exports/questions.json")
    export_exercises_pdf(exercises, "exports/questions.pdf")

The JSON document contains schema_version, generated_at, count and an
exercises array. Each exercise includes id, topic, difficulty, prompt,
correction and answer.

## Validation

    ruff check python tests/python
    pytest tests/python -v

Automated tests cover reproducibility, all supported topics and difficulty
levels, invalid parameters, JSON content, PDF signatures and CLI execution.


## Public website publication

The `resources.html` page links to static JSON question banks and printable PDF worksheets. Build all public files with:

    PYTHONPATH=python python -m calcora.publication --output-dir .

The command writes `data/public/education-profiles.json`, two files under
`data/public/question-banks/`, and two PDFs under `resources/`. GitHub Actions
runs this build before the browser audit and before publishing the Pages artifact.
The public page is translated into English, French and Arabic; the current PDF
worksheets are explicitly labelled as French-language resources.
