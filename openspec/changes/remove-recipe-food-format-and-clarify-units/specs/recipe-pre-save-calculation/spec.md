## MODIFIED Requirements

### Requirement: New recipes can be calculated before saving
The system SHALL offer an explicit calculation action on the ingredient step of recipe creation and SHALL calculate from the current in-memory recipe inputs without requiring a persisted recipe identifier. The displayed calculation result MUST identify energy as kilocalories per 100 grams and nutrient amounts using each returned unit per 100 grams.

#### Scenario: Successful pre-save calculation
- **WHEN** a user selects supported ingredients, supplies valid calculation constraints, and starts calculation for a new unsaved recipe
- **THEN** the system submits the current inputs to the recommender and displays the returned composition and nutrition result on the same step
- **THEN** the displayed energy and nutrient measurements explicitly identify their per-100-gram basis
- **THEN** the system does not persist the recipe solely because calculation was requested

#### Scenario: Invalid or infeasible calculation
- **WHEN** pre-save calculation inputs are invalid or the recommender cannot produce a composition
- **THEN** the system keeps the user on the ingredient step and displays an actionable error
- **THEN** the system does not persist a recipe or replace the current form inputs

#### Scenario: Calculation request in progress
- **WHEN** a pre-save calculation request is in progress
- **THEN** the calculation action indicates progress and prevents a duplicate calculation request
