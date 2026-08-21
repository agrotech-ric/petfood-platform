## Purpose

Defines a single format-neutral recipe model and makes the 100-gram basis of recipe calculation inputs and outputs explicit to users.

## ADDED Requirements

### Requirement: Recipes are format-neutral
The system SHALL create, update, list, filter, sort, and display recipes without a wet or dry format classification. Recipe requests and responses MUST NOT require or expose a format property, and format-neutral behavior MUST apply to recipes created before and after this change.

#### Scenario: User creates a recipe
- **WHEN** a user supplies all required recipe fields without a wet or dry format
- **THEN** the system accepts and stores the recipe without assigning a food format

#### Scenario: User browses recipes
- **WHEN** a user views a recipe list, a pet's nutrition recipes, or a recipe profile
- **THEN** no wet/dry value, format column, format metadata, or format filter is presented

#### Scenario: Client uses the obsolete format contract
- **WHEN** a client requests format filtering or format sorting after the format-neutral contract is active
- **THEN** the recipe API does not treat format as a supported filter or sort field

#### Scenario: Existing recipe is read after migration
- **WHEN** a user opens a recipe that existed before the format classification was removed
- **THEN** all remaining recipe data and any calculation snapshot remain available without a format value

### Requirement: Recipe calculation measurements state their basis
The system SHALL present calculated recipe energy as kilocalories per 100 grams. Nutrient constraints SHALL be identified as grams per 100 grams, and every calculated nutrient amount normalized to 100 grams SHALL combine the nutrient's own returned unit with the same per-100-gram basis.

#### Scenario: User configures nutrient constraints
- **WHEN** a user enters or adjusts minimum and maximum recipe nutrient constraints
- **THEN** the interface identifies those values as grams per 100 grams

#### Scenario: User reviews calculated energy
- **WHEN** a recipe calculation result displays its energy value
- **THEN** the value is labeled as kilocalories per 100 grams rather than as an unlabeled kilocalorie amount

#### Scenario: User reviews calculated nutrients
- **WHEN** a recipe calculation result displays a nutrient returned in grams, milligrams, micrograms, or another supported unit
- **THEN** the interface displays that returned unit per 100 grams without changing the numeric value

#### Scenario: User reviews daily targets
- **WHEN** the interface displays a daily energy target or a daily feeding amount alongside normalized calculation results
- **THEN** the daily value retains its daily basis and is not mislabeled as a per-100-gram value

### Requirement: Recipe measurement labels are localized
The system SHALL provide the format-neutral recipe interface and all per-100-gram measurement labels through the existing Russian, English, and Kazakh localization system.

#### Scenario: Supported locale is active
- **WHEN** a user views recipe inputs or results in Russian, English, or Kazakh
- **THEN** the relevant labels and measurement basis are displayed in the active locale
