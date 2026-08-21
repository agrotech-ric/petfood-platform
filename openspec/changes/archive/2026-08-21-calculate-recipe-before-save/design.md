## Context

See `proposal.md` for motivation and `specs/recipe-pre-save-calculation/spec.md` for observable behavior. The React recipe wizard already holds all optimizer inputs in component state and its calculation handler calls the recommender without using a recipe identifier. However, the calculation action and result are gated to edit mode, while the create request currently omits the in-memory calculation result and version.

The change is limited to `frontend-next/`. Pets-service remains the owner of persisted recipes and calculation snapshots, and the recommender remains the owner of calculations. Existing authenticated gateway routing and API contracts are unchanged.

## Goals / Non-Goals

**Goals:**

- Reuse one calculation path for create and edit flows.
- Keep calculation separate from persistence and make the current-result lifecycle explicit.
- Save a current calculation through the existing recipe payload contract.
- Add only the new UI text required by this change to the existing `ru`, `en`, and `kz` dictionaries.

**Non-Goals:**

- Automatic or debounced optimization after form edits.
- Recommender algorithm, pets-service API, DTO, schema, or authorization changes.
- Localization or refactoring of unrelated legacy recipe-wizard text.
- Changing the ability to save an uncalculated draft.

## Decisions

### Use an explicit calculation action before the save action

The ingredient step will expose the existing optimizer action for both create and edit modes. A successful response will render the existing calculation result component directly below the optimization controls. Saving remains a separate action.

This avoids unexpected and potentially expensive requests while users are still adjusting ingredients. Automatic calculation on every edit was rejected because it can generate overlapping requests, transient infeasibility errors, and unnecessary recommender load.

### Persist the same in-memory result on create and update

The create path will build its recipe payload with the current calculation result and calculation version, matching the update path. The existing payload mapper already derives each ingredient's result percentage and grams from that result, so no contract change is required.

If there is no current result, the payload continues to contain no snapshot and null ingredient outputs, preserving draft compatibility.

### Invalidate results at calculation-affecting state boundaries

A small state helper will clear both the calculation result and its version whenever an optimization input changes. Ingredient selection and ranges, nutrient ranges, maximize targets, energy, and pet/health inputs will use this path. Name and description edits will not invalidate the result.

Recommendation refreshes also change optimizer inputs and therefore invalidate any prior result. Clearing rather than merely marking the result stale prevents stale percentages from entering the create payload and keeps the displayed state aligned with what will be saved.

### Reuse the established result and request states

The existing calculation loading flag, error mapping, scroll target, and result visualization will serve both modes. The UI will prevent duplicate submissions while calculation is running. New action labels and progress/status text will be sourced from the current translation context and added to all three dictionaries.

No new frontend dependency or architectural abstraction is introduced.

## Risks / Trade-offs

- [A broad form setter could clear a result for an unrelated metadata edit] → Route only known optimizer inputs through the invalidation helper and cover name/description behavior in manual verification.
- [A missed optimizer input could allow a stale snapshot to be saved] → Enumerate every field consumed by the recommender request and verify each invalidates the result.
- [Create and edit controls could diverge again] → Render the shared calculate action and result outside mode-specific conditions.
- [The recommender may reject intermediate ingredient constraints] → Preserve the existing actionable error handling and all user inputs so the user can adjust and retry.

## Migration Plan

Deploy the frontend change with the existing backend and recommender versions; no data migration or coordinated API rollout is needed. Verify create-with-calculation, create-without-calculation, edit calculation, invalidation, locales, themes, and responsive layout. Rollback consists of restoring the previous frontend build; recipes created with snapshots remain compatible with the previous UI.
