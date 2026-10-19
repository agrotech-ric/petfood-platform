## 1. Template Mapping and Rendering Structure

- [x] 1.1 Refactor recipe PDF generation into a dedicated prescription document shell while leaving the pet-profile PDF shell and endpoint behavior unchanged.
- [x] 1.2 Implement the A4 page groups, typography, orange separators, alternating peach rows, compact tables, footer page numbers, signature area, and overflow-safe print rules from the Word reference.
- [x] 1.3 Map recipe, linked-pet, health, contraindication, ingredient, and calculation snapshot data to the approved prescription sections without recalculating stored values.

## 2. Charts, Guidance, and Localization

- [x] 2.1 Implement template-specific vector composition and macro donut charts with matching legends/tables and stable empty states.
- [x] 2.2 Add the standardized use, preparation, storage, warning, consent, and signature content from the reference to backend report messages.
- [x] 2.3 Provide every new report label and paragraph in Russian, English, and Kazakh, including localized age/category/unit/date/value formatting and unavailable markers.
- [x] 2.4 Keep unsupported individual veterinary instructions visibly unavailable and add no inferred feeding schedule, duration, or per-serving energy.

## 3. Automated and Visual Verification

- [x] 3.1 Expand pets-service tests for template field mapping, three-page reference-sized output, missing optional data, long-content overflow, locale glyphs, ownership, draft rejection, and pet-export regression.
- [x] 3.2 Generate a Russian fixture matching the DOCX example, render both PDFs to images at equal resolution, and compare all pages side by side; tune layout until the structure, spacing, tables, charts, and legal/signature sections match closely.
- [x] 3.3 Run pets-service tests and the share/export sandbox smoke test, rebuild the affected container, and inspect startup/export logs.
- [x] 3.4 Review durable PDF-export documentation, run `git status --short`, `git diff --check`, and focused diff review, and record any unavoidable renderer differences from the Word reference.

## 4. Production Export Visual Corrections

- [x] 4.1 Replace font-dependent checkbox glyphs with renderer-safe drawn controls in ingredient and consent rows.
- [x] 4.2 Tighten the recipe and nutrient page geometry so a normal production export retains the approved three-page composition without splitting recommendations onto a fourth page.
- [x] 4.3 Render the reported production PDF fixture after the correction and compare all three pages with the DOCX reference, including consent, signatures, page numbering, tables, and charts.
- [x] 4.4 Run focused pets-service tests, rebuild the sandbox pets container, execute the PDF smoke test, and review the final diff.
