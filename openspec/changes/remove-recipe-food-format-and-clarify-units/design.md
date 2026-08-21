## Context

See `proposal.md` for motivation. The recipe format currently crosses the entire pets-owned recipe contract: frontend state and types, create/update payloads, list query parameters, response DTOs, persistence mappings, and the `pets.recipes.food_format` column. The recommender calculation contract is already normalized to 100 grams and already returns a unit for each nutrient, but the frontend does not consistently include that basis in visible labels.

The pets service owns recipe persistence and schema evolution. The recommender owns the calculation algorithm and does not consume the recipe wet/dry format selected by the frontend.

## Goals / Non-Goals

**Goals:**

- Remove recipe format as a domain field rather than preserving a hidden default.
- Preserve existing recipes and calculation snapshots while discarding only obsolete wet/dry values.
- Make normalized measurement labels unambiguous without changing calculation values or request scaling.
- Keep frontend, API DTOs, persistence, filtering, sorting, and tests aligned.

**Non-Goals:**

- Do not alter food-form categories inside the recommender's source datasets or statistical preprocessing.
- Do not add user-selectable measurement systems or convert between units.
- Do not change daily calorie targets, daily feeding amounts, nutrient norms, or optimization mathematics.
- Do not remove other recipe classifications such as age category or breed size.

## Decisions

### Remove format from the contract and schema

Delete the format field from frontend recipe types and form state, pets-service request/response DTOs, entity mapping, list filters, and supported sort fields. Remove format controls and columns from recipe creation, recipe browsing, pet nutrition, and recipe profile views.

This is preferred over retaining a constant or nullable value because a hidden field would preserve an unsupported distinction in the API and data model. Existing clients that still send a JSON `format` property may have it ignored by normal deserialization behavior, but format is no longer a documented or supported request field. Format query filtering and sorting are removed rather than silently mapped to another field.

### Remove stored values with a forward-only Flyway migration

Add the next pets-service Flyway migration to drop the format check constraint, format index, and `food_format` column from `pets.recipes`. Existing rows require no data rewrite because the remaining recipe columns and JSON calculation snapshots are independent of format.

This is preferred over making the column nullable because the product requirement is to eliminate the distinction completely. Deployment must start the migrated pets-service together with a frontend built against the format-neutral response contract.

### Treat nutrient constraints as grams per 100 grams

The four supported constraint values—moisture, protein, carbohydrates, and fat—already flow to recommender fields defined per 100 grams. Display their basis as `g/100 g` (localized), while leaving stored and transmitted numeric values unchanged.

This is preferred over percentages because the returned optimization model describes amounts per 100 grams and explicit mass units match the user's requested wording. Although grams per 100 grams are numerically equivalent to mass percentage, displaying the unit avoids ambiguity.

### Compose result units from the returned unit and normalization basis

Continue trusting the recommender's unit for each nutrient and render it as `<unit>/100 g`. Render energy as `kcal/100 g`. Apply the same presentation to both an unsaved calculation result and a saved recipe snapshot. Keep daily target labels as `kcal` per day/context and feeding amounts as grams so normalized and daily values are not conflated.

This is preferred over hardcoding every nutrient to grams because minerals and vitamins may use milligrams or micrograms. No backend or recommender contract change is required for measurement labeling.

### Localize the affected interface text

Move every new or changed format-neutral and measurement label used by this work into the existing `ru`, `en`, and `kz` dictionaries and access it through the existing language context. No new localization mechanism is introduced.

## Risks / Trade-offs

- [Older frontend and newer pets-service are deployed at different times] -> Deploy the compatible frontend and pets-service in the same release and verify recipe create, list, edit, and profile flows after migration.
- [Dropped wet/dry values cannot be restored for recipes created after migration] -> Treat rollback as application plus schema recovery; if rollback is required, restore a pre-migration database backup or recreate the column with an explicitly chosen fallback only after owner approval.
- [A unit is accidentally labeled twice, such as `g/100 g/100 g`] -> Store raw units in calculation snapshots as today and add the normalization basis only in the display formatter; cover representative gram, milligram, and microgram values in tests or focused verification.
- [Daily norms are mislabeled as normalized values] -> Limit the per-100-gram suffix to recommender fields whose contract names and models specify `per_100g`; explicitly verify daily target and feeding labels.
- [Obsolete format references remain in a secondary screen] -> Search the active beta frontend and pets recipe service for format types, labels, filters, mappings, and database references during final diff review.

## Migration Plan

1. Update pets-service code and tests to use the format-neutral recipe contract.
2. Add the new Flyway migration that removes the recipe format constraint, index, and column.
3. Update frontend types, recipe workflows, filters, tables, metadata, payloads, and localized measurement labels.
4. Run focused pets-service tests, frontend lint/build, OpenSpec validation, and standard diff checks.
5. Rebuild the sandbox pets-service container, inspect Flyway and startup logs, and smoke-test existing and new recipe flows in all supported locales.

Rollback requires stopping writes, restoring the compatible application generation, and restoring a pre-migration database backup or applying a reviewed recovery migration that recreates `food_format`. Because new format-neutral recipes have no truthful wet/dry value, automatic reverse migration is not safe.
