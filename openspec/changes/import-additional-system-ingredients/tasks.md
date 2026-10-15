## 1. Normalize and validate the supplied dataset

- [x] 1.1 Add a deterministic importer that reads the supplied workbook, maps the currently supported ingredient fields, restores date-formatted decimal cells, and derives missing calories with the existing recipe energy formula.
- [x] 1.2 Define and review explicit canonical aliases for all exact, translated, and semantic matches against existing system ingredients while keeping distinct products separate.
- [x] 1.3 Generate a normalized UTF-8 data snapshot containing all 79 source rows and add validation for required identity fields, finite non-negative nutrients, allowed ranges, canonical uniqueness, and exact source-row coverage.
- [x] 1.4 Add focused importer tests covering ordinary rows, the horse-meat date-formatted decimals, zero-calorie derivation, semantic aliases, and rejection of invalid values.

## 2. Align recommender data

- [x] 2.1 Merge the normalized rows into `ingredients_data.csv`, updating canonical matches and adding missing ingredients without duplicate canonical identities.
- [x] 2.2 Update `mapping_ingredients.csv` so every curated system ingredient resolves from its website display identity to a recommender full name.
- [x] 2.3 Add recommender catalog-consistency tests that require all 79 curated concepts to resolve exactly once with matching supported nutrient values.
- [x] 2.4 Add representative recommender tests proving newly added supplement, bone/cartilage, oil, meat, and broth ingredients can be included in recipe optimization.

## 3. Import global pets-service records

- [x] 3.1 Add the next Flyway migration after `V38` with system-only upserts for the normalized catalog, preserving existing IDs and setting new records to `owner_id = NULL` and `recommender_supported = TRUE`.
- [x] 3.2 Add pets-service migration or repository tests proving all curated records are global, canonical matches are not duplicated, and similarly named private ingredients remain unchanged.
- [x] 3.3 Verify existing system-ingredient update and delete protections apply to newly imported records without changing the API contract.

## 4. Document catalog maintenance

- [x] 4.1 Document the normalized catalog source, supported-field mapping, alias review, and database/recommender synchronization workflow in the relevant architecture or development documentation.

## 5. Verification

- [x] 5.1 Run the importer and consistency checks from a clean copy and confirm deterministic output with exactly 79 curated source rows represented.
- [x] 5.2 Run `python -m pytest tests` in `nutrient-recommender-main` and the focused pets-service Gradle tests.
- [x] 5.3 Rebuild the affected sandbox pets and recommender containers, apply Flyway in sandbox, and inspect startup logs for migration or data-loading failures.
- [x] 5.4 Smoke-test authenticated system-catalog listing and a representative recipe calculation using a newly added ingredient.
- [x] 5.5 Run OpenSpec validation, `git diff --check`, inspect `git status` and the focused diff, and report any verification that could not be completed.
