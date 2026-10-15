## MODIFIED Requirements

### Requirement: Owners can export fully calculated recipes as PDF
The system SHALL let an authenticated owner download a PDF report only for a fully calculated recipe. The report SHALL reproduce the approved veterinary feed prescription structure, populated from the saved recipe, linked pet, health context, contraindications, ingredients, and calculation snapshot. It SHALL contain the recipe overview, pet profile, health summary, daily calorie and food requirements, ingredient amounts, composition and macro charts, nutrient tables, standardized use/preparation/storage guidance, warnings, consent wording, and owner/veterinarian signature lines. Values that require an explicit veterinary instruction and are not stored MUST be shown as unavailable and MUST NOT be inferred.

#### Scenario: Owner downloads a calculated recipe
- **WHEN** the authenticated owner requests a PDF for a recipe with calculated status, a saved calculation result, and a calculation timestamp
- **THEN** the system downloads a valid veterinary feed prescription PDF containing the complete available recipe and calculation data in the approved section order
- **AND** the normal reference-sized Russian fixture follows the approved three-page A4 visual structure

#### Scenario: Recipe is linked to a pet
- **WHEN** an eligible recipe has a linked pet
- **THEN** the first prescription page shows the available pet photograph, name, identifier, breed, birth date, age, weight, gender, activity, reproductive details, health target, symptoms, and contraindications

#### Scenario: Prescription-only values are not stored
- **WHEN** feeding frequency, application duration, or per-serving energy has no authoritative saved value
- **THEN** the corresponding template row remains present with a localized unavailable marker
- **AND** the system does not derive or fabricate a veterinary instruction

#### Scenario: Saved calculation contains nutritional results
- **WHEN** the saved calculation includes daily targets, composition, macro nutrition, nutrients, minerals, or vitamins
- **THEN** the PDF maps those values to the matching reference metrics, charts, and tables without changing their numeric meaning or units

#### Scenario: Saved calculation has no digestibility data
- **WHEN** the saved recipe calculation does not contain compatible digestibility data
- **THEN** the PDF omits digestibility values and charts rather than calculating or fabricating them

#### Scenario: Optional recipe data is absent
- **WHEN** the linked pet has no photograph, optional profile field, health context, contraindication, or a calculation group is empty
- **THEN** the system still produces a valid readable PDF with a stable layout and an explicit localized empty or unavailable state

#### Scenario: Dynamic content exceeds the reference fixture
- **WHEN** ingredient, nutrient, or localized text content cannot fit safely in the normal three-page layout
- **THEN** the document adds pages while preserving section order, readable typography, and unclipped rows

#### Scenario: Owner requests a draft recipe PDF
- **WHEN** the authenticated owner requests a draft or incompletely calculated recipe
- **THEN** the system rejects the request and does not return a partial prescription

#### Scenario: Non-owner requests a recipe PDF
- **WHEN** an authenticated user requests a PDF for another owner's recipe
- **THEN** the system denies the request without exposing recipe or linked-pet data

### Requirement: PDFs are localized and readable
The system SHALL generate the report in the owner's currently selected Russian, English, or Kazakh interface language. Each download SHALL use a PDF content type and a safe descriptive filename. Recipe exports SHALL use the approved prescription's A4 print hierarchy, orange separators, alternating table rows, chart placement, page numbers, standardized guidance, warnings, consent, and signature area. Reports SHALL use embedded fonts covering all supported scripts and stable pagination without clipped sections.

#### Scenario: Owner exports a veterinary prescription in Russian
- **WHEN** the owner requests a calculated-recipe export with the Russian locale
- **THEN** its labels and standard wording match the Russian reference document and its visual hierarchy is suitable for side-by-side comparison with that reference

#### Scenario: Owner exports in a supported language
- **WHEN** the owner requests an export while a supported interface language is selected
- **THEN** report labels, dates, number formatting, and filenames use that language
- **AND** Cyrillic and Kazakh-specific characters render correctly without font substitution gaps

#### Scenario: Owner exports in another supported language
- **WHEN** the owner requests a calculated-recipe export in English or Kazakh
- **THEN** the same prescription structure is retained with localized labels, standard wording, dates, units, and filename
- **AND** all language-specific glyphs render without substitution gaps

#### Scenario: Report contains chart data
- **WHEN** a recipe calculation contains composition or macro values represented visually
- **THEN** the PDF contains print-legible vector charts derived from those saved values and accompanying textual or tabular values

#### Scenario: Report spans multiple pages
- **WHEN** the report content exceeds one page
- **THEN** sections and charts remain readable and are not clipped across page boundaries
