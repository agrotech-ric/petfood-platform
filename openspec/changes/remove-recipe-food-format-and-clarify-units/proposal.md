## Why

Recipes are currently classified as wet or dry even though the product no longer distinguishes those formats. Calculation screens also show energy and nutrient values without consistently stating that the values are normalized to 100 grams, which can cause users to interpret them as daily or whole-recipe amounts.

## What Changes

- **BREAKING** Remove the wet/dry format from the recipe model, recipe create and update requests, recipe responses, list filtering and sorting, frontend forms, recipe lists, pet nutrition views, and recipe profiles.
- Migrate existing recipe records by removing the obsolete `food_format` column and its constraint/index without changing the remaining recipe data or calculation snapshots.
- Label calculated recipe energy explicitly as kilocalories per 100 grams wherever the calculation result is presented.
- Label recipe nutrient constraints as grams per 100 grams and present calculated nutrient values using each value's returned measurement unit per 100 grams.
- Localize all new or changed user-facing labels in Russian, English, and Kazakh.
- Keep the recommender's internal source-data food categories unchanged because they support its internal statistical model and are not a user-selectable recipe classification.

## Capabilities

### New Capabilities
- `recipe-model-and-measurement`: Defines format-neutral recipes and explicit per-100-gram measurement labels for recipe calculation inputs and results.

### Modified Capabilities
- `recipe-pre-save-calculation`: Clarifies how normalized energy and nutrient measurements are presented when users review a calculation before saving.

## Impact

- Frontend recipe types, filters, tables, profile metadata, form state and payload construction in `frontend-next/`.
- Recipe DTOs, filtering, mapping, persistence and tests in the pets service under `backend-main-sandbox/`.
- A new pets-service Flyway migration that removes the obsolete recipe format column, constraint, and index.
- The recipe API contract is intentionally breaking for clients that still send, query, sort by, or read `format`.
- Existing recipe calculation values and snapshots remain numerically compatible; this change makes their normalization explicit rather than changing the algorithm.
- Rollback requires an application rollback plus restoration or recreation of the removed recipe format column; the discarded wet/dry values cannot be reconstructed reliably after new format-neutral recipes are created.
