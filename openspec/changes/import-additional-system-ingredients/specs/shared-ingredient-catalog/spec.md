## Purpose

Define a consistent, globally available ingredient catalog that remains aligned with recipe calculation data while preserving private user ingredients.

## ADDED Requirements

### Requirement: Curated ingredients are globally available
The system SHALL expose every accepted ingredient from the curated additional-ingredient dataset as a system ingredient to every authenticated user.

#### Scenario: User lists system ingredients
- **WHEN** an authenticated user requests the system ingredient catalog
- **THEN** every accepted curated ingredient is returned as a global, read-only system ingredient

#### Scenario: Different users see the same curated entry
- **WHEN** two authenticated users request the same curated ingredient
- **THEN** both users receive the same system-owned ingredient record rather than user-owned copies

### Requirement: Curated imports do not create semantic duplicates
The system MUST match curated rows to existing system ingredients by a reviewed canonical identity and SHALL represent each curated ingredient concept exactly once.

#### Scenario: Curated row matches an existing system ingredient
- **WHEN** a curated row is an alias or translated representation of an existing system ingredient
- **THEN** the existing system ingredient is updated or mapped without creating a second global record for the same concept

#### Scenario: Curated row does not match an existing system ingredient
- **WHEN** a validated curated row has no canonical match
- **THEN** the system creates one new global ingredient record

#### Scenario: Private ingredient resembles a curated ingredient
- **WHEN** a user-owned private ingredient has the same name and subtype as a curated row
- **THEN** the private ingredient remains unchanged and the curated system record is handled independently

### Requirement: Website and recommender catalogs remain aligned
Every curated system ingredient SHALL have a corresponding recommender representation using the same canonical identity and supported nutrient values.

#### Scenario: Curated ingredient is selected for a recipe
- **WHEN** a user selects a curated system ingredient and requests recipe optimization
- **THEN** the recommender resolves the ingredient and uses its nutrient profile without an unsupported-ingredient error

#### Scenario: Catalog alignment is verified
- **WHEN** the catalog consistency check runs
- **THEN** it reports no curated ingredient missing from either the system catalog or recommender data

### Requirement: Published nutrient data is valid for calculation
The import process MUST validate every supported nutrient value and MUST NOT publish malformed, non-finite, negative, or demonstrably corrupted values. When the supplied calorie field is zero for an ingredient with non-zero macronutrients, the system SHALL derive calories using the energy formula already used by recipe calculation.

#### Scenario: Spreadsheet-formatted decimal is normalized
- **WHEN** a numeric nutrient was automatically stored by the spreadsheet as a date-formatted serial value
- **THEN** the import normalizes it to the displayed decimal nutrient value before validation

#### Scenario: Ingredient has macronutrients but zero calories
- **WHEN** a curated ingredient has non-zero protein, fat, or carbohydrate values and a zero calorie value
- **THEN** its published calorie value is derived from those macronutrients

#### Scenario: Invalid value remains after normalization
- **WHEN** a curated row still contains an invalid supported nutrient value after deterministic normalization
- **THEN** the import fails with the affected row and field identified and publishes no partial catalog update

### Requirement: Existing catalog access rules are preserved
Curated system ingredients SHALL follow the existing system-ingredient authorization rules and MUST NOT change the ownership or mutability of user-created ingredients.

#### Scenario: User attempts to modify a curated ingredient
- **WHEN** an authenticated non-system user attempts to update or delete a curated system ingredient
- **THEN** the system rejects the operation under the existing system-ingredient policy
