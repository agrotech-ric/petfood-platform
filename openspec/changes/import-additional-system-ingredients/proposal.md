## Why

The shared ingredient catalog does not contain the 79 additional ingredients supplied by the product team, so veterinarians cannot consistently use those supplements, oils, bones, broths, and other foods in recipes. The catalog must be expanded without creating duplicate system ingredients or allowing the website database and recommender dataset to diverge.

## What Changes

- Import every supplied ingredient as a shared system ingredient visible to all authenticated users.
- Upsert source rows against existing system ingredients using reviewed canonical identities so semantically equivalent records are updated rather than duplicated.
- Keep the pets-service catalog and recommender dataset aligned, including recommender support metadata and the nutrient fields currently supported by both services.
- Validate source values and derived calories before import; reject non-finite, negative, malformed, or clearly corrupted nutrient data instead of silently publishing it.
- Add repeatable checks proving that every supplied ingredient is represented once in both catalogs and can participate in recipe calculation.
- Do not add new nutrient fields for source columns that the current platform data model and recipe calculator do not support.

## Capabilities

### New Capabilities

- `shared-ingredient-catalog`: Defines how curated ingredient datasets become globally available, deduplicated, calculation-compatible system ingredients.

### Modified Capabilities

None.

## Impact

- A new pets-service Flyway data migration will add or update global ingredient records without changing private user ingredients.
- `nutrient-recommender-main/data/ingredients_data.csv` and its ingredient mapping data will be updated to contain matching canonical records.
- Import validation and recommender tests will cover row counts, canonical uniqueness, supported units, and representative calculations.
- The public API shape and frontend workflow remain unchanged; the shared catalog gains additional records.
- Primary risks are source-data corruption, semantic duplicates, unit mismatches, and divergence between the database and CSV. Rollback requires reverting the recommender dataset and applying a compensating data migration rather than editing an applied Flyway migration.
