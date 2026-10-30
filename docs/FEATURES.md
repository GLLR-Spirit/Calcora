# Calcora feature inventory

This document summarizes the feature areas represented by the current repository structure, application pages, JavaScript modules and regression tests. It is an orientation guide, not a guarantee that every feature is complete or that every academic profile is officially validated.

## Calculator categories

The repository groups calculator pages under these areas:

- **Algeria and grades:** academic averages, BAC-related tools and university/LMD calculations.
- **Mathematics:** percentage and other mathematical calculators.
- **Conversions:** unit and measurement conversions.
- **Science:** science measurement and formula tools.
- **Finance:** finance-oriented calculations.

The exact calculators and their input rules are defined by their individual pages and scripts. Consult the page itself before relying on a result.

## Student and study tools

| Area | Current implementation evidence | Notes |
|---|---|---|
| Student workspace | `student-workspace.html`, `assets/js/student-workspace.js` | Subject and mark management, coefficients, academic data and local history. |
| University pathway | `university-planner.html`, `assets/js/university-planner.js` | University pathway planning resources. |
| Exam countdown | `exam-planner.html`, `assets/js/exam-planner.js` | Exam dates, priorities, completion state and local backup/import. |
| Revision planning | `study-planner.html`, `assets/js/study-planner.js` | Revision plans, sessions and planning support. |
| Study hub | `study-hub.html`, `assets/js/study-hub.js` | Entry point for study and organization tools. |
| Revision and progress | `revision.html`, `study-progress.html`, `assets/js/revision.js`, `assets/js/progress-dashboard.js` | Revision activities and progress views. |
| Practice exercises | `practice-exercises.html` | Practice and learning exercises. |
| Learning Lab | `learning-lab.html`, `assets/js/learning-lab.js` | Interactive learning utilities. |
| Focus sessions | `focus-session.html`, `assets/js/focus-session.js` | Focus-session workflow. |
| BAC simulator | `assets/js/bac-simulator.js` | BAC simulation logic and related tests. |

## Languages and presentation

- Translation dictionaries are maintained in `locales/en.js`, `locales/fr.js` and `locales/ar.js`.
- Arabic uses right-to-left page direction where implemented.
- Light and dark themes are supported through shared theme styles and settings.
- The homepage provides search and category navigation.

A translation dictionary existing in the repository does not by itself prove that every string on every page is translated. The language synchronization tests and a manual review of each important workflow remain necessary.

## Local data and backups

Several student tools use browser storage. Their saved data is normally limited to the browser profile and device where it was entered. Export/import support is specific to each tool; check the interface and its local notice before relying on a backup.

Do not enter passwords, payment details, government identifiers or sensitive private academic records.

## Accuracy status of academic rules

Calcora supports editable generic formulas and Algerian education-oriented pages. It does not claim that all coefficients or institution-specific rules are verified for every school, BAC session, university or programme.

See [Algerian grading rules](algerian-grading-rules.md) and [education profile source status](algerian-education-profiles.md) before describing a profile as official.

## Related automated coverage

The test suite includes dedicated checks for student workspace, LMD calculations, BAC simulation, exam planning, study planning, revision, spaced repetition, measurement tools, finance calculations, Learning Lab, accessibility, internal links, localization/navigation and SEO.

See [Testing and quality checks](TESTING.md) for commands and workflow behaviour.
