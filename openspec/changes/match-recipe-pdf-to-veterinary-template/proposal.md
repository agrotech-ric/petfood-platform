## Why

The calculated-recipe PDF currently uses a generic platform report layout. Veterinary staff now have an approved three-page Word reference whose hierarchy, tables, charts, legal wording, signature area, and print styling must be reflected in the exported recipe so that the downloaded document can be used as a recognizable veterinary feed prescription.

## What Changes

- Replace the generic calculated-recipe PDF body with the A4 veterinary prescription structure shown in `приммер_шаблон_рекомендации_по_рецепту.docx`.
- Map saved recipe, linked-pet, health, contraindication, ingredient, and calculation-snapshot data into the matching positions in the reference layout.
- Reproduce the reference's typography, orange separators, alternating peach table rows, chart placement, page numbering, warnings, consent text, and owner/veterinarian signature blocks.
- Keep the existing authenticated recipe PDF endpoint, eligibility rules, safe filename behavior, output limits, and Russian/English/Kazakh locale support.
- Render unavailable prescription-only values as an explicit localized em dash instead of inventing a feeding schedule, treatment duration, or per-serving energy value.
- Leave pet-profile PDF output unchanged.

## Capabilities

### Modified Capabilities
- `profile-pdf-export`: Changes the calculated-recipe PDF from a generic report into the approved veterinary prescription template while preserving authorization, completeness, localization, and safe generation behavior.

## Impact

- Recipe rendering and localized report messages in `backend-main-sandbox/services/pets/`.
- Recipe PDF tests and export smoke verification.
- No endpoint, frontend request, database schema, recommender contract, or pet-profile PDF change.
- No runtime dependency on Microsoft Word or LibreOffice; the DOCX is a visual/content reference and the service continues to render PDF with OpenHTMLtoPDF.
