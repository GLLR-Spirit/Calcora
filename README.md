# Calcora

Calcora is a free, static web toolkit for school, university and everyday calculations, with a strong focus on Algerian education and support for English, French and Arabic.

## Student tools
- Weighted averages and academic grade calculators.
- Student workspace for subjects, marks, coefficients, semester averages, targets and progress history.
- University pathway planner and LMD-related tools.
- Revision planning and an exam countdown planner.
- Personalized revision suggestions based on upcoming exam dates, selected priorities, and marks saved in the local student workspace.
- JSON/CSV backups for supported student data.

## Project structure
- `assets/css/`: shared styles and light/dark themes.
- `assets/js/`: application, calculators and student tools.
- `locales/`: language dictionaries.
- `settings/` and `pages/`: preferences and informational pages.
- `calculators/`: grouped calculator pages.
- `education-levels/`: school, BAC, university and work-related resources.
- `fields/` and `subjects/`: study fields and subjects.
- `.github/workflows/`: deployment workflows.

## Technology and hosting
The project is built with **HTML, CSS and vanilla JavaScript** and can be hosted as a static site on GitHub Pages. It does not require a server or paid API for its local student tools. User-entered student and exam data is stored in the browser on the current device; use the export options before clearing browser data or changing devices.

Academic rules can vary by institution and year. Check each calculator's stated formula and confirm local grading rules before treating a result as official.
