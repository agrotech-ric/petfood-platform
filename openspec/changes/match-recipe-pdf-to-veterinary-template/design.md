## Context

The reference document is an A4, three-page Russian veterinary feed prescription. It uses Arial-like typography, 20 mm horizontal margins, an orange accent rule, peach alternating table rows, a pet photograph, two donut charts, nutrient tables, standardized preparation/storage guidance, warnings, consent wording, and owner/veterinarian signature lines. The current pets-service export already renders HTML/CSS/SVG with OpenHTMLtoPDF and embeds a configured Cyrillic-capable font.

The recipe calculation snapshot supplies normalized energy (`calories`, kcal/100 g), daily food amount (`dailyNorm`, g/day), daily calorie requirement (`dailyCaloriesNorm`, kcal/day), composition, macro nutrition, other nutrients, minerals, and vitamins. Recipe and pet entities supply the remaining available profile data. Feeding frequency, application duration, and energy per serving are not persisted and must not be fabricated.

## Goals / Non-Goals

**Goals:**

- Match the reference document's page hierarchy, spacing, table treatment, chart arrangement, and signature/legal sections closely enough for side-by-side visual review.
- Populate every reference section from authoritative saved data where that data exists.
- Preserve safe output for missing photos, optional pet data, empty nutrient groups, and long dynamic content.
- Preserve Russian, English, and Kazakh exports using the existing backend report localization mechanism.
- Keep generation bounded by the current image, record, output-size, queue, and timeout limits.

**Non-Goals:**

- Do not add recipe-editor fields or database columns for veterinary instructions.
- Do not infer medical advice, feeding frequency, application duration, or per-serving values.
- Do not change calculation formulas or recommender payloads.
- Do not redesign pet-profile PDFs.
- Do not execute LibreOffice or consume the DOCX at runtime.

## Decisions

### Build a dedicated recipe document instead of restyling the shared report shell

Split recipe rendering into template-specific HTML helpers and CSS while leaving the existing pet report document path intact. The reference has fixed page-level composition that conflicts with the generic hero, cards, section boxes, chart containers, and `page / pages` footer. A dedicated recipe shell prevents regressions to pet-profile exports and makes each prescription page independently testable.

### Use explicit page groups with graceful overflow

For the normal reference-sized fixture, group content into three A4 sections with page breaks after the pet/profile page and the nutrition page. Use `page-break-inside: avoid` on headings, metric pairs, compact tables, charts, warnings, consent, and signatures. Dynamic ingredient or nutrient lists may flow onto additional pages rather than shrink below readable size or clip content; the prescribed section order remains unchanged.

### Map saved fields without recalculation

Use the following authoritative mapping:

- export date: saved `calculatedAt` date, falling back to the recipe update date only when required;
- recipe heading and introductory text: recipe name and description;
- age and breed-size labels: recipe target categories;
- pet summary: linked pet photo, name, identifier, breed, birth date, current weight, gender, activity, reproductive status/detail, and puppy count;
- health summary: recipe target disorder/condition and target symptoms, plus the linked pet's contraindicated ingredients;
- daily calories: `calculationResult.dailyCaloriesNorm` in kcal/day;
- daily food amount: `calculationResult.dailyNorm` in g/day;
- energy density: `calculationResult.calories` in kcal/100 g;
- ingredients and composition chart: saved calculated composition and recipe ingredient metadata;
- macro chart/table: saved `nutrition` and `nutritionPer100` data;
- nutrient tables: saved `minerals`, `vitamins`, and `nutrients` arrays.

No values are recomputed from percentages. Missing optional fields use the localized unavailable marker and empty collections produce a stable empty state.

### Keep prescription-only advice honest

The feeding schedule, per-serving energy, and application duration rows remain present because they are part of the approved template, but display a localized em dash until the domain model gains explicit fields. Standardized method-of-introduction, preparation, storage, warning, and consent paragraphs are localized static report copy based on the reference document. Signature lines remain blank for manual completion; no account-service lookup is introduced for the veterinarian name.

### Generate charts as vector SVG

Continue generating donut charts as inline SVG so they remain sharp in PDF. Add compact template-specific chart helpers that use the reference palette, labels, and side-by-side placement. Accompany every chart with a table or direct labels so the information remains readable in print and accessible when chart rendering is unavailable.

### Preserve locale and authorization behavior

Extend `ReportMessages` with all prescription labels and standard paragraphs in Russian, English, and Kazakh. The existing authenticated endpoint and owner filter remain unchanged, as do calculated-status eligibility and filename sanitation. Unsupported locales continue to fail explicitly.

## Risks / Trade-offs

- [Pixel-level Word pagination differs from OpenHTMLtoPDF] -> Match A4 dimensions, margins, font metrics, explicit page groups, and reference-sized test data; verify rendered pages side by side instead of depending on Word at runtime.
- [Long ingredient or nutrient lists exceed three pages] -> Allow controlled additional pages and prevent clipping or unreadably small text; exact three-page pagination applies to the reference-sized fixture.
- [Font substitution changes line wrapping] -> Use the configured embedded report font consistently and tune sizes/line heights against the rendered reference.
- [Missing data tempts derived medical advice] -> Display an explicit unavailable marker for unsupported individual recommendations and cover this behavior in tests.
- [Recipe-only CSS changes pet exports] -> Keep separate document builders and add regression coverage for both export types.
- [Locale text expands beyond Russian geometry] -> Keep flexible row heights and run PDF generation/text extraction checks for all three locales.

## Verification Plan

1. Add focused service tests for field mapping, missing-data behavior, authorization preservation, and unchanged pet export.
2. Generate a fixture PDF containing the same data as the Word reference and assert valid PDF output plus expected section text and order.
3. Render the generated Russian PDF to page images and compare all pages side by side with the LibreOffice-rendered reference at the same resolution.
4. Generate English and Kazakh fixtures and verify Cyrillic/Kazakh glyphs, pagination, and no clipped sections.
5. Run pets-service tests, `scripts/share-export-smoke.sh` against the rebuilt sandbox, container log inspection, `git diff --check`, and focused diff review.

## Implementation Notes

The reference DOCX and generated Russian fixture were rendered to A4 page images at 120 DPI and compared across all three pages. The implemented hierarchy, margins, orange rules, alternating rows, chart/table placement, legal blocks, signatures, and page numbering follow the reference. OpenHTMLtoPDF uses the service's embedded Inter-compatible font rather than Word's embedded Arial/Calibri fonts, so individual glyph widths and line breaks can differ slightly. Dynamic identifiers, optional photos, localized text, and longer lists may also alter line wrapping or add pages by design; content remains readable and unclipped.
