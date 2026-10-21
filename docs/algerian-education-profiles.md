# Algerian education profiles — implementation status

Calcora now has separate calculator pages for primary school, middle school/BEM, high school, BAC, university, and work-related calculations. These pages share a reusable calculation engine.

## What the pages currently do
- Simple average and weighted average for user-entered marks.
- Combined two-period average with editable weights.
- Required mark calculation for a target average.
- Editable mark scale and coefficients.
- English, French and Arabic interface, including Arabic RTL.
- Light/dark theme preference stored locally in the browser.

## Important limitations
The sample rows are neutral examples, not official subjects or coefficients. The generic two-period formula is only appropriate when the institution uses that weighting. Do not present a page as an official BAC, BEM or university rule set without a current primary source.

## Verification checklist before adding official profiles
1. Confirm the applicable academic year and level/stream.
2. Find an official Ministry or institution document.
3. Record its exact URL/title, publication date and relevant page/section.
4. Confirm scale, subject list, coefficients, term/semester weighting, rounding, compensation and progression rules.
5. Add a source note to the relevant profile and test examples against the source.
6. Re-check when the academic year or regulation changes.

## Next work
Add verified subject lists and coefficients by BAC stream and university field, then expand modules/UE and semester aggregation with institution-specific options.
