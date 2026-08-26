# Profile PDF Export Specification

## Purpose

Let authenticated owners download complete, readable, and visually consistent PDF reports for pet profiles and fully calculated recipes.

## Requirements

### Requirement: Owners can export complete pet profiles as PDF
The system SHALL let an authenticated owner download a PDF report for their pet. The report SHALL include every available pet profile field, including passport details, photo, descriptions, current condition, health history, contraindications, weight and activity history with charts, and summaries of fully calculated recipes.

#### Scenario: Owner downloads a complete pet profile
- **WHEN** the authenticated owner requests a PDF for their pet
- **THEN** the system downloads a valid PDF containing all available profile sections and calculated recipe summaries

#### Scenario: Optional pet data is absent
- **WHEN** the pet lacks a photo or an optional profile section
- **THEN** the system still produces a valid PDF and clearly omits or marks the unavailable content without a broken image or layout

#### Scenario: Non-owner requests a pet PDF
- **WHEN** an authenticated user requests a PDF for another owner's pet
- **THEN** the system denies the request without exposing the pet data

#### Scenario: Unauthenticated user requests a pet PDF
- **WHEN** an unauthenticated user requests a pet PDF, including from a public share page
- **THEN** the system requires authentication and does not return the document

### Requirement: Owners can export fully calculated recipes as PDF
The system SHALL let an authenticated owner download a PDF report only for a fully calculated recipe. The report SHALL include all saved recipe inputs, ingredients and quantities, calculation metadata, nutrition results, and graphs derivable from the saved calculation. When a pet is linked, the report SHALL begin with a brief pet summary and photo when available.

#### Scenario: Owner downloads a calculated recipe
- **WHEN** the authenticated owner requests a PDF for a recipe with calculated status, a saved calculation result, and a calculation timestamp
- **THEN** the system downloads a valid PDF containing the complete available recipe and calculation report

#### Scenario: Owner requests a draft recipe PDF
- **WHEN** the authenticated owner requests a PDF for a draft or incompletely calculated recipe
- **THEN** the system rejects the request and does not return a partial report

#### Scenario: Recipe is linked to a pet
- **WHEN** an eligible recipe has a linked pet
- **THEN** the first report section shows the pet's name, species, breed, age, weight, and photo when available

#### Scenario: Saved calculation has no digestibility data
- **WHEN** the saved recipe calculation does not contain compatible digestibility data
- **THEN** the PDF omits digestibility values and charts rather than calculating or fabricating them

#### Scenario: Non-owner requests a recipe PDF
- **WHEN** an authenticated user requests a PDF for another owner's recipe
- **THEN** the system denies the request without exposing recipe or linked-pet data

### Requirement: PDF availability is reflected in private controls
The private pet page SHALL show a download action for the pet report. The private recipe page SHALL show share and download actions only while the recipe is fully calculated.

#### Scenario: User views a pet profile
- **WHEN** the owner views their pet profile
- **THEN** share and download actions are available independently of whether the pet has a photo

#### Scenario: User views a calculated recipe
- **WHEN** the owner views a fully calculated recipe
- **THEN** share and download actions are available

#### Scenario: User views an ineligible recipe
- **WHEN** the owner views a draft or incompletely calculated recipe
- **THEN** share and download actions are not shown

### Requirement: PDFs are localized and readable
The system SHALL generate the report in the owner's currently selected Russian, English, or Kazakh interface language. Each download SHALL use a PDF content type and a safe descriptive filename. The report SHALL use embedded fonts covering all supported scripts, a print-adapted visual style consistent with the product, clear units and labels, legible charts, and stable pagination without clipped sections.

#### Scenario: Owner exports in a supported language
- **WHEN** the owner requests an export while a supported interface language is selected
- **THEN** report labels, dates, number formatting, and filenames use that language
- **AND** Cyrillic and Kazakh-specific characters render correctly without font substitution gaps

#### Scenario: Report spans multiple pages
- **WHEN** the report content exceeds one page
- **THEN** sections and charts remain readable and are not clipped across page boundaries

#### Scenario: Report contains chart data
- **WHEN** a profile history or recipe calculation contains values represented visually in the product
- **THEN** the PDF contains a print-legible chart derived from those saved values and an accompanying textual or tabular representation

### Requirement: PDF generation does not depend on public sharing
PDF authorization and content SHALL be based on the authenticated owner's resource, regardless of whether a public share link exists. Generating a PDF MUST NOT create, rotate, revoke, or disclose a share link.

#### Scenario: Owner exports an unshared resource
- **WHEN** the owner downloads a PDF for an eligible resource with no active public link
- **THEN** the export succeeds without creating a public link

#### Scenario: Owner exports a shared resource
- **WHEN** the owner downloads a PDF for a resource with an active public link
- **THEN** the active link and its validity remain unchanged
