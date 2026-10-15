## Context

See `proposal.md` for motivation. Pets-service owns the shared ingredient records, while the recommender reads an immutable CSV dataset and translation mapping. The supplied workbook contains 79 rows and more nutrient columns than the current platform supports. Six rows already match current catalog records directly, and several others require reviewed semantic aliasing. The workbook also contains date-formatted Excel serials in the horse-meat row that represent decimal nutrient values, and its calorie column is zero even where macronutrients are non-zero.

## Goals / Non-Goals

**Goals:**

- Produce one reviewed normalized source snapshot for all 79 supplied rows.
- Upsert global pets-service records without changing their IDs when a canonical match already exists.
- Keep pets-service values, recommender rows, and translation mappings consistent.
- Make validation deterministic and executable in automated checks.

**Non-Goals:**

- Add chlorine, amino-acid, biotin, pH, dry-matter, or ratio fields to the API and database.
- Change ingredient screens, permissions, or recipe-builder interaction.
- Modify private user-created ingredients.
- Infer or research replacement values for source fields that cannot be normalized deterministically.

## Decisions

### Commit a normalized, reviewable data snapshot

Convert the workbook into a UTF-8 CSV containing canonical identity, Russian display name and subtype, category, and every nutrient supported by the current ingredient model. Keep this normalized snapshot in the recommender data directory and use it as the reviewed source for generated catalog changes.

This is preferred over consuming the external attachment at runtime because production images must be reproducible and must not depend on an unversioned workbook. Directly hand-editing both the large migration and `ingredients_data.csv` was rejected because it makes drift difficult to detect.

### Normalize only deterministic spreadsheet artifacts

Date-formatted serial cells are converted using the workbook's number format to their displayed `day.month` decimal. For example, a displayed `4.8` nutrient remains numeric `4.8`, rather than the underlying Excel serial. The three bone/cartilage rows whose carbohydrate-by-difference value is the known `-1` rounding sentinel are normalized to zero. Other malformed values fail validation instead of being guessed.

Calories are derived only when the source calorie value is zero and at least one macronutrient is non-zero, using the existing recipe energy equation: `3.5 * protein + 8.5 * fat + 3.5 * carbohydrates`. A truly non-caloric row may retain zero.

### Use explicit canonical aliases for existing ingredients

Maintain a small reviewed alias map for source rows that represent an existing system ingredient under another full name or category. Matching and updates are restricted to `owner_id IS NULL`; private records never participate. Exact full-name matches and Russian name/subtype matches are candidates, but semantic matches are accepted only when listed explicitly.

This is preferred over fuzzy matching because fuzzy matching could merge materially different products, such as generic fish oil and cod-liver oil.

### Generate an idempotent Flyway upsert and verify it against recommender data

Add a new migration after `V38` that upserts canonical system rows, sets `recommender_supported = TRUE`, and preserves existing IDs. The update predicate includes `owner_id IS NULL`, and inserts use `owner_id = NULL`. The migration must not edit any applied migration.

Update `ingredients_data.csv` and `mapping_ingredients.csv` from the same normalized source. A repository test compares canonical keys and supported nutrient values between the normalized source, migration payload, and recommender files.

### Preserve the current API contract

Map only fields already represented by `Ingredient`, `IngredientResponse`, and the recommender model. Unsupported workbook columns remain in the original workbook but are intentionally excluded from this change. No frontend code or localization change is required because names and categories are data values.

## Risks / Trade-offs

- **[Semantic aliases merge the wrong foods]** → Keep aliases explicit and review every non-exact match; do not fuzzy-match.
- **[Workbook data contains hidden formatting corruption]** → Normalize only recognized date-formatted decimals and run range, finiteness, and aggregate validation before generating outputs.
- **[Database and recommender drift]** → Generate from one normalized snapshot and fail tests on missing keys or nutrient differences.
- **[Existing recipes depend on ingredient IDs]** → Update matching system rows in place and never delete/reinsert them.
- **[Unsupported source nutrients are not visible]** → Record this as an intentional non-goal; extending the nutrient model requires a separate API/schema change.
- **[Flyway data migration cannot be rolled back automatically]** → Roll back application artifacts and apply a reviewed compensating migration if production data must be restored.

## Migration Plan

1. Normalize and validate all 79 workbook rows, including spreadsheet-formatted decimals and derived calories.
2. Review explicit aliases and prove that the normalized source has unique canonical identities.
3. Update recommender ingredient and mapping datasets and run catalog consistency tests.
4. Add the next pets-service Flyway migration with idempotent system-only upserts.
5. Run pets-service and recommender tests, build affected containers, apply the migration in sandbox, and inspect startup logs.
6. Smoke-test system catalog listing and a representative recipe calculation using a newly added ingredient.

Rollback uses the previous recommender image and a new compensating Flyway migration for database values; applied migrations are never edited or removed.
