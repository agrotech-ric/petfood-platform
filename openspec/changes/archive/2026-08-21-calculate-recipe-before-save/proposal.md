## Why

Users currently have to save a new recipe as a draft and reopen it before they can calculate and review its optimized composition. This interrupts the creation flow and leaves the first saved version without a calculation snapshot.

## What Changes

- Add an explicit recipe calculation action to the ingredient step for both new and existing recipes.
- Display the calculated composition and nutrition results before a new recipe is saved.
- Persist a successful in-memory calculation and its version when the new recipe is saved.
- Keep draft saving available without requiring a successful calculation.
- Invalidate a displayed calculation when an input that affects optimization changes, so stale results are not presented or persisted as current.
- Do not automatically run optimization after every ingredient edit; calculation remains a deliberate user action.

## Capabilities

### New Capabilities

- `recipe-pre-save-calculation`: Covers calculating, reviewing, invalidating, and optionally saving an optimized recipe result during initial recipe creation.

### Modified Capabilities

None.

## Impact

- Affects the recipe creation and editing wizard in `frontend-next/` and its localized UI text.
- Reuses the existing recommender API and recipe create contract; no backend API, database schema, authentication, or authorization changes are expected.
- Existing draft creation remains compatible. Rollback restores the current save-first workflow without requiring data migration.
