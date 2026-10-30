# Calcora

**Calcora** is a free, browser-based toolkit for school, university, science, finance and everyday calculations. It also includes study-planning and learning tools, with particular attention to Algerian education.

- **Website:** https://gllr-spirit.github.io/Calcora/
- **Repository:** https://github.com/GLLR-Spirit/Calcora
- **Languages:** English, French and Arabic (including right-to-left layout)
- **Hosting:** GitHub Pages
- **Core stack:** HTML, CSS and vanilla JavaScript

## What you can do

### Calculations
- Calculate weighted and academic averages using editable marks and coefficients.
- Use BAC and university/LMD-oriented grade tools.
- Calculate percentages and work with mathematics, science and measurement tools.
- Convert common units and use finance-related calculators.

### Study and learning
- Organize subjects, marks, coefficients, semesters and academic progress in the student workspace.
- Plan revision tasks and study sessions.
- Track exam dates with a countdown planner.
- Use revision, practice-exercise and spaced-repetition features.
- Explore learning resources and interactive tools in the Learning Lab.

The available tools are grouped into dedicated pages and categories. See [the feature guide](docs/FEATURES.md) for a more detailed inventory. The presence of a general calculator or profile page does not mean that every institution-specific rule is already verified.

## Quick start

Calcora is a static website. To use it, open the [public website](https://gllr-spirit.github.io/Calcora/). No Calcora account is required for the browser-based tools.

To inspect or modify the source:

1. Clone or download this repository.
2. Open the project folder in a code editor.
3. Serve the folder with a local static HTTP server.
4. Open the local address in a browser.

For example, with Python installed:

```bash
python3 -m http.server 4173
```

Then visit `http://localhost:4173/`. The project does not currently define a package manifest as its primary development entry point; the CI workflows install the browser-test dependency when needed.

## Technology

- **HTML** for pages and content.
- **CSS** for shared layouts, components and light/dark themes.
- **Vanilla JavaScript** for calculators, localization and interactive tools.
- **Node.js 22** in GitHub Actions for JavaScript syntax checks and regression tests.
- **Playwright + Chromium** for browser smoke tests.
- **GitHub Pages** for static hosting and GitHub Actions for automated deployment.

There is no application server required for the core static experience. GitHub Pages does not execute backend code.

## Project structure

| Path | Purpose |
|---|---|
| `assets/css/` | Shared styles, responsive layouts and themes |
| `assets/js/` | Calculator logic and interactive application features |
| `calculators/` | Calculator pages grouped by subject |
| `components/` | Shared interface components and styles |
| `docs/` | Project, architecture, education-rule and feature documentation |
| `education-levels/` | Education-level resources and profiles |
| `fields/` | Study-field profiles |
| `locales/` | English, French and Arabic translations |
| `pages/` | About, contact, FAQ and privacy pages |
| `scripts/` | Build/deployment helper scripts |
| `settings/` | Language and theme settings |
| `subjects/` | Subject-related pages and resources |
| `tests/` | Regression, quality, SEO and browser tests |
| `.github/workflows/` | Quality checks, Lighthouse baseline and Pages deployment |

## Development and tests

The repository's automated quality workflow uses Node.js 22.

Run the regression tests locally:

```bash
node --test tests/*.test.cjs
```

Check JavaScript syntax in the application directories:

```bash
find assets/js components locales settings -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

The browser smoke test uses Playwright and Chromium. The CI workflow installs these dependencies, serves the static site, and runs `tests/browser-smoke.cjs`. See [Testing and quality checks](docs/TESTING.md) before changing the workflows.

## Data and privacy

Many student tools store their data in the current browser profile using browser storage. This data is not automatically synchronized between devices or browsers. Some tools provide JSON or CSV backup/export options; availability depends on the tool.

- Export a backup before clearing browser data or changing devices.
- Keep exported files private because they may contain personal study information.
- Basic calculations are designed to run in the browser without a Calcora account.
- The public website is hosted by GitHub Pages, which receives normal network requests when the site is opened.

Read the [privacy documentation](docs/PRIVACY.md) and the [public privacy notice](pages/privacy.html) for details and limitations.

## Algerian education rules: accuracy first

Academic grading rules can differ by education level, BAC stream, university, programme and academic year. Calcora provides editable, general-purpose calculations; it must not imply that unverified coefficients or formulas are official.

Before treating a result as official, confirm the formula, coefficients, mark scale, rounding and any compensation or eliminatory rules with the relevant institution and current official documents.

- [Algerian grading rules and accuracy policy](docs/algerian-grading-rules.md)
- [Education profiles and source status](docs/algerian-education-profiles.md)

## Documentation

- [Feature inventory](docs/FEATURES.md)
- [Architecture](docs/architecture.md)
- [Testing and quality checks](docs/TESTING.md)
- [Privacy and data handling](docs/PRIVACY.md)
- [Algerian grading accuracy policy](docs/algerian-grading-rules.md)
- [Algerian education profiles](docs/algerian-education-profiles.md)
- [Project roadmap](docs/roadmap.md)

## Current limitations

- Student information saved in browser storage is generally device- and browser-profile-specific.
- Backup/export support is tool-dependent; do not assume every tool exports data.
- GitHub Pages is static hosting and cannot run server-side application code.
- Institution-specific grading rules require current official verification.
- Automated tests reduce regression risk but do not prove that every calculation, translation or device/browser combination is error-free.

## Contributing and reporting issues

Before proposing a change, read the documentation and inspect the existing implementation and tests. Keep changes focused, preserve existing behaviour, and include or update regression tests when functionality changes. Report reproducible bugs with the affected page, browser, steps and expected versus actual behaviour. Do not include passwords, private student records or other sensitive information in public issues.

## License

No license information is currently documented in this README. Unless a license is added to the repository, do not assume that the source code is released for unrestricted reuse or redistribution.
