## MODIFIED Requirements

### Requirement: New recipes can be calculated before completion
The system SHALL offer an explicit calculation action on the continuous recipe authoring page and SHALL calculate from the current form inputs without requiring a separately completed recipe. The displayed calculation result MUST identify energy as kilocalories per 100 grams and nutrient amounts using each returned unit per 100 grams.

#### Scenario: Successful calculation from an autosaved draft
- **WHEN** a user supplies a non-blank recipe name, selects supported ingredients, supplies valid calculation constraints, and starts calculation from an autosaved draft
- **THEN** the system submits the current inputs to the recommender and displays the returned composition and nutrition result on the same continuous page
- **THEN** the displayed energy and nutrient measurements explicitly identify their per-100-gram basis
- **THEN** the calculation action does not navigate to another step or page

#### Scenario: Invalid or infeasible calculation
- **WHEN** calculation inputs are invalid or the recommender cannot produce a composition
- **THEN** the system keeps the user on the continuous authoring page and displays an actionable error
- **THEN** the current draft inputs remain persisted and the draft does not acquire a calculation snapshot

#### Scenario: Calculation request in progress
- **WHEN** a recipe calculation request is in progress
- **THEN** the calculation action indicates progress and prevents a duplicate calculation request

### Requirement: Calculated results are persisted with authored recipes
The system SHALL automatically persist the current successful calculation result, ingredient output amounts, and calculation version with the authored recipe. The persisted recipe SHALL have calculated status only while that calculation remains current.

#### Scenario: Successful result is produced
- **WHEN** a named draft receives a successful calculation result
- **THEN** the system automatically persists the calculation snapshot and calculated ingredient percentages and grams
- **THEN** the persisted recipe is marked calculated after that save succeeds

#### Scenario: Draft has no calculation
- **WHEN** recipe inputs have been autosaved without a successful current calculation
- **THEN** the persisted recipe remains a draft without a calculation snapshot

### Requirement: Stale calculations are not treated as current
The system SHALL invalidate the displayed calculation result when the user changes an input that affects optimization and SHALL automatically persist the recipe without the stale result. The system SHALL require an explicit recalculation to produce a new current result.

#### Scenario: Calculation input changes
- **WHEN** a user changes selected ingredients, ingredient ranges, nutrient constraints, maximized nutrients, target energy, or pet and health parameters after a successful calculation
- **THEN** the previous calculation is no longer displayed or included in the next autosave
- **THEN** the persisted recipe returns to draft status after that save succeeds
- **THEN** the system continues to offer the explicit calculation action for the updated inputs

#### Scenario: Non-calculation metadata changes
- **WHEN** a user changes only recipe metadata that does not affect optimization, such as the recipe name or description
- **THEN** the current calculation remains available and is included in the next autosave
