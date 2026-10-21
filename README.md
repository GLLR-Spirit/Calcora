# Calcora

Multilingual calculators, starting with Algerian school and university needs. English, French and Arabic are planned from the first version.

## Structure
- assets/css: shared layout and separate light/dark themes
- assets/js: app and calculator logic
- locales: one file per language
- settings: language and theme preferences
- pages: informational pages
- calculators: grouped by grade, math, science, finance and conversions
- education-levels: primary, middle school, high school, university and work
- fields and subjects: degree programs and school subjects
- components: reusable interface styles and calculator descriptions
- docs: architecture and roadmap
- .github/workflows: deployment workflow

## Hosting note
GitHub Pages runs static HTML/CSS/JavaScript. React requires a build step; Node.js, Python, PHP and Ruby backend code and SQL databases require separate compatible hosting. Do not put database credentials in public frontend files.

Academic rules vary by institution and year. Configurable formulas and verified sources are required before any rule is labelled official.
