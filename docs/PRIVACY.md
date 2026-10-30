# Privacy and data handling

This document summarizes the data-handling boundaries visible in the current Calcora implementation and public privacy page. It is not a legal guarantee or a substitute for the policies of hosting and external service providers.

## Browser-based calculations

The basic calculators are designed to process entered values in the browser. A Calcora account is not required for these calculations.

## Browser storage

Some tools save preferences or study information in browser storage. Depending on the feature, this can include:

- Language and theme preferences.
- Student workspace information and marks.
- Study plans, exam dates and revision progress.
- Notes or saved items.

Storage is generally scoped to the browser profile on the device where the information was entered. It is not automatically synchronized across devices.

## Backups and deletion

Some tools provide export/import or backup functions. Support is feature-specific; do not assume every page has an export option.

- Export a backup before clearing site data or moving to another device, when the tool supports it.
- Keep exported backup files private.
- Clearing browser storage or site data may remove saved information.
- Importing a backup may replace existing data; read the confirmation message in the relevant tool.

## Hosting and external services

The public site is hosted with GitHub Pages. Opening it generates network requests to the hosting provider, which may process technical request information under its own policies.

Some pages may link to third-party websites or load external resources. Those services have their own privacy practices. Check the relevant tool notice before using a feature that sends data outside the browser.

## Information not to enter

Do not enter passwords, payment details, government identifiers, private academic records or other sensitive personal information into Calcora. Do not publish private information in public GitHub issues or pull requests.

## Maintenance requirements

Review this document and `pages/privacy.html` whenever the project adds or changes:

- Analytics or advertising.
- Authentication or user accounts.
- Server-side processing or external APIs.
- Cloud synchronization or remote backups.
- New data collection or third-party integrations.

Update the public privacy notice before releasing a feature that materially changes data handling.
