## Purpose

Allow users to calculate and review an optimized recipe composition during initial recipe creation without first persisting and reopening a draft.

## ADDED Requirements

### Requirement: New recipes can be calculated before saving
The system SHALL offer an explicit calculation action on the ingredient step of recipe creation and SHALL calculate from the current in-memory recipe inputs without requiring a persisted recipe identifier.

#### Scenario: Successful pre-save calculation
- **WHEN** a user selects supported ingredients, supplies valid calculation constraints, and starts calculation for a new unsaved recipe
- **THEN** the system submits the current inputs to the recommender and displays the returned composition and nutrition result on the same step
- **THEN** the system does not persist the recipe solely because calculation was requested

#### Scenario: Invalid or infeasible calculation
- **WHEN** pre-save calculation inputs are invalid or the recommender cannot produce a composition
- **THEN** the system keeps the user on the ingredient step and displays an actionable error
- **THEN** the system does not persist a recipe or replace the current form inputs

#### Scenario: Calculation request in progress
- **WHEN** a pre-save calculation request is in progress
- **THEN** the calculation action indicates progress and prevents a duplicate calculation request

### Requirement: Calculated results are saved with new recipes
The system SHALL include the current successful calculation result, ingredient output amounts, and calculation version when the user saves a new recipe after calculation.

#### Scenario: Save after successful calculation
- **WHEN** a user saves a new recipe while a current successful calculation is displayed
- **THEN** the created recipe contains the calculation snapshot and calculated ingredient percentages and grams

#### Scenario: Save draft without calculation
- **WHEN** a user saves a valid new recipe without performing a successful calculation
- **THEN** the system creates a draft without a calculation snapshot

### Requirement: Stale calculations are not treated as current
The system SHALL invalidate the displayed calculation result when the user changes an input that affects optimization, and SHALL require an explicit recalculation to produce a new current result.

#### Scenario: Calculation input changes
- **WHEN** a user changes selected ingredients, ingredient ranges, nutrient constraints, maximized nutrients, target energy, or pet and health parameters after a successful calculation
- **THEN** the previous calculation is no longer displayed or included as the current result in a subsequent save
- **THEN** the system continues to offer the explicit calculation action for the updated inputs

#### Scenario: Non-calculation metadata changes
- **WHEN** a user changes only recipe metadata that does not affect optimization, such as the recipe name or description
- **THEN** the current calculation remains available for review and saving

### Requirement: Calculation remains user initiated
The system SHALL NOT automatically submit optimization requests merely because the user edits ingredients or constraints.

#### Scenario: Ingredient selection is edited
- **WHEN** a user selects, removes, or adjusts an ingredient before requesting calculation
- **THEN** the system updates the form without automatically starting an optimization request

### Requirement: Pre-save calculation controls are localized
The system SHALL provide all user-facing text introduced for pre-save calculation in Russian, English, and Kazakh through the existing localization system.

#### Scenario: Supported locale is active
- **WHEN** the recipe creation page is displayed under Russian, English, or Kazakh locale
- **THEN** the pre-save calculation action, progress state, save action, and related status text use that locale
