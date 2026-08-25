## Why

Recipe authoring is split across two screens, uses inconsistent "food" terminology, and loses unsaved input when a user leaves the page. The flow should present one coherent recipe workspace and preserve work automatically so users can revise any field without navigating backward or manually creating an incomplete recipe.

## What Changes

- Reorder the primary sidebar navigation to show My pets, My recipes, and Ingredients.
- Replace user-facing references to food/feed with recipe terminology across the active recipe list, authoring, calculation, pet nutrition, and recipe profile surfaces in Russian, English, and Kazakh.
- Replace the two-step new-recipe wizard with one continuous page containing recipe details, pet parameters, recommendations, ingredients, constraints, calculation controls, and results.
- Automatically create an owner-scoped draft after the first meaningful edit and debounce subsequent saves, with visible saving, saved, and retryable error states.
- Keep the generated draft identifier in the route so a refresh resumes the same draft and internal navigation can flush pending changes.
- Show incomplete recipes in the normal recipe list with a localized Draft badge and a localized Untitled recipe fallback when the stored draft name is blank.
- Preserve explicit calculation as the transition from an input-only draft to a calculated recipe; changes to calculation inputs invalidate the previous result and return the persisted item to draft status.
- Allow blank names only for input-only autosaved drafts. A calculated recipe still requires a non-blank name.

## Capabilities

### New Capabilities

- `recipe-authoring-workflow`: Defines recipe-first terminology, single-page authoring, recoverable autosaved drafts, save-state feedback, and draft presentation in recipe lists.

### Modified Capabilities

- `recipe-pre-save-calculation`: Moves pre-save calculation into the continuous authoring page and defines how calculation and later input changes affect the persisted draft state.

## Impact

- Frontend navigation, recipe list/profile/pet nutrition labels, the recipe form component, recipe service types, CSS modules, and all three locale dictionaries under `frontend-next/`.
- Pets-service recipe request validation and service rules under `backend-main-sandbox/services/pets/`; the existing `draft` and `calculated` statuses remain authoritative and no schema migration is expected because the non-null name column can store an empty string for drafts.
- Recipe create and update behavior changes compatibly for existing named clients, but an input-only request may now contain a blank name while a calculated request may not.
- Draft ownership continues to be enforced from the JWT subject. Autosave requests use the existing owner-scoped endpoints and must not expose or overwrite another user's recipe.
- No recommender algorithm, ingredient ownership, recipe calculation mathematics, or production topology changes are in scope.
- Failed autosaves must leave the current form intact and provide an explicit retry path; rollback restores the previous frontend and validation behavior without a data migration, while already-created blank-name drafts remain readable through the fallback label.
