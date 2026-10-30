# Architecture

## Runtime model

Calcora is a static website built with HTML, CSS and browser-native JavaScript. GitHub Pages serves the published files; it does not execute backend application code.

The core website does not require a server-side application or a paid API. Interactive features execute in the browser, and some tools persist user data through browser storage.

## Main layers

### Pages and navigation

HTML files provide the homepage, calculator pages, student tools, settings and informational pages. Calculator pages are grouped by category under `calculators/`; education-oriented resources are grouped under `education-levels/`, `fields/` and `subjects/`.

### Presentation

- `assets/css/` contains shared styles, responsive rules and theme styles.
- `components/` contains shared interface components and component styles.
- Light/dark theme selection is handled through the settings and shared theme styles.

### Application logic

`assets/js/` contains feature-specific scripts. Examples include the student workspace, exam planner, study planner, university planner, BAC simulator, Learning Lab, measurement tools, finance tools and progress dashboard.

Pages load the scripts they need; this is not a bundled single-page application. Avoid assuming that a module is loaded on every page.

### Localization

`locales/en.js`, `locales/fr.js` and `locales/ar.js` provide translation dictionaries. Arabic requires right-to-left layout handling. Some standalone pages also contain page-specific translation data, so localization changes should be tested across the affected routes rather than only on the homepage.

### Data persistence

Several tools use browser storage with feature-specific keys. This makes the experience simple and server-independent, but data is not automatically synchronized between browsers or devices. Backup and import/export behaviour differs by feature.

## Build and deployment

GitHub Actions workflows under `.github/workflows/` perform syntax checks, regression tests, browser checks and Pages deployment.

The deployment workflow:
1. Checks out the source.
2. Uses Node.js 22 for syntax and regression checks.
3. Installs Playwright and Chromium for browser testing.
4. Applies commit-based cache-busting query parameters to local CSS/JavaScript asset references.
5. Uploads the static site as a GitHub Pages artifact.
6. Deploys the artifact and runs the browser smoke test against the resulting Pages URL.

The cache-versioning helper is `scripts/version-static-assets.cjs`.

## Constraints and design rules

- Do not add server-only code and expect it to run on GitHub Pages.
- Do not add empty files in unrelated programming languages merely to imply support.
- A future backend, database, authentication system or cloud synchronization feature would require a separately hosted service and a security/privacy review.
- Keep academic rules configurable and source-backed; do not assume identical coefficients across institutions or academic years.
- Preserve direct page navigation, relative asset paths and the existing localization model when changing the structure.

## Suggested future data model

For institution-specific academic profiles, keep the relationships explicit:

`education level → country/institution profile → programme/field → subject/module → calculator`

Each verified profile should record its academic year, mark scale, coefficients, official source, publication date and last review date. Different programmes may require different compensation, rounding or eliminatory-grade rules.
