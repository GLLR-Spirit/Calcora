# Testing and quality checks

Calcora uses Node.js-based regression tests and a Playwright/Chromium browser smoke test in GitHub Actions.

## Requirements

- Node.js 22 for the CI-equivalent JavaScript checks and test runner.
- Python 3 for the simple local static HTTP server used in CI.
- Playwright and Chromium for the interactive browser smoke test.

The repository does not use a root `package.json` as its primary test configuration. The workflows install Playwright when required.

## Run regression tests

From the repository root:

```bash
node --test tests/*.test.cjs
```

This executes the Node.js test files in `tests/`, including coverage for:

- Student workspace and progress dashboard.
- BAC simulator and LMD calculator.
- Exam planner, study planner, revision and spaced repetition.
- Finance and science/measurement calculations.
- Learning Lab and calculator guidance.
- Homepage navigation, language behaviour and internal links.
- Accessibility and SEO metadata.
- Static asset cache-versioning behaviour.

A passing test suite means that the covered assertions passed. It does not prove that every page, formula, translation or browser/device combination is correct.

## Check JavaScript syntax

The CI workflow checks JavaScript files in the application directories:

```bash
find assets/js components locales settings -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

## Run the browser smoke test

The browser test expects the site to be served over HTTP. A local server can be started with:

```bash
python3 -m http.server 4173
```

In a second terminal, install Playwright if it is not already available and install Chromium:

```bash
npm install --no-save playwright
npx playwright install chromium
```

Then run:

```bash
SITE_URL=http://127.0.0.1:4173/ node tests/browser-smoke.cjs
```

On Windows PowerShell, set the environment variable for the current command session:

```powershell
$env:SITE_URL = "http://127.0.0.1:4173/"
node tests/browser-smoke.cjs
```

The smoke test may create screenshots in `artifacts/`. The GitHub Actions workflow uploads available screenshots as workflow artifacts.

## GitHub Actions workflows

### Quality checks — `.github/workflows/quality.yml`

Runs on pull requests targeting `main`, pushes to `main`, and manual dispatch. It:

1. Checks out the repository.
2. Sets up Node.js 22.
3. Checks JavaScript syntax.
4. Runs `node --test tests/*.test.cjs`.
5. Installs Playwright and Chromium.
6. Applies static asset versioning to the browser-test copy.
7. Serves the site locally and runs the browser smoke test.
8. Uploads available screenshots.

### GitHub Pages deployment — `.github/workflows/pages.yml`

Runs on pushes to `main` and manual dispatch. It repeats syntax and regression checks, prepares the Pages artifact, versions local static asset URLs, deploys the site, and runs the browser smoke test against the deployment URL.

A successful deployment workflow confirms that its configured deployment and post-deployment test steps completed. It is not a substitute for checking the public site manually on target devices and browsers.

### Lighthouse baseline — `.github/workflows/lighthouse-baseline.yml`

This workflow is part of the repository's quality/performance tooling. Review its current configuration and run history before interpreting its results as a current performance score.

## Recommended change-validation procedure

1. Identify the page, script and existing tests affected by the change.
2. Make the smallest focused change possible.
3. Run the relevant test file first.
4. Run the complete regression suite.
5. Run the JavaScript syntax check.
6. Run the browser smoke test and inspect generated screenshots.
7. Check the changed pages in English, French and Arabic, including RTL layout.
8. Review the pull request diff before merging.
9. After deployment, verify the public pages and key interactions in a real browser.

Do not claim a test was run unless its command completed and its result was inspected.
