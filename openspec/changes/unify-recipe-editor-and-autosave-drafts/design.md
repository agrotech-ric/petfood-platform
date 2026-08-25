## Context

See `proposal.md` for motivation. The active frontend uses one `RecipeFormWizard` component for create and edit but hides its two major sections behind local `step` state for new recipes. Explicit create/update calls currently happen only from save buttons. The pets service already owns recipes, exposes owner-scoped create/update/delete endpoints, persists `draft` or `calculated` status according to the presence of a calculation snapshot, and returns status in list items. The only server-side obstacle to saving the first partial edit is the non-blank request validation for `name`; the database column itself can safely retain a non-null empty string.

The existing completed but unarchived `remove-recipe-food-format-and-clarify-units` change defines the current format-neutral and per-100-gram presentation. This change preserves those requirements and removes remaining user-facing food terminology without changing recommender data keys or feeding calculations.

## Goals / Non-Goals

**Goals:**

- Use the same continuous form for new and existing recipes.
- Persist only user-initiated authoring changes, not initialization side effects.
- Serialize autosaves and make their state recoverable and understandable.
- Reuse the existing recipe status, endpoints, ownership checks, API client, route structure, theme tokens, and localization system.
- Keep a current calculation snapshot synchronized with the draft inputs that produced it.

**Non-Goals:**

- Do not run recommendations or optimization automatically during autosave.
- Do not create a second local-only draft store or offline synchronization system.
- Do not change recipe optimization mathematics, recommender datasets, internal `PetFood` legacy model names, or the pet profile's broader Nutrition tab domain.
- Do not introduce a new recipe lifecycle beyond the existing `draft` and `calculated` statuses.

## Decisions

### Render the authoring sections continuously

Remove create-mode `step` state, the Continue transition, and conditional section rendering. Recipe metadata, dog parameters, recommendations, ingredient selection, constraints, calculation action, and result render in document order for both create and edit. Existing cards and responsive CSS remain the layout units so the change does not introduce a new form framework.

This is preferred over tabs, accordions, or an in-page stepper because those options still hide fields and conflict with the requirement that any earlier input remain directly editable.

### Reuse recipe create and update endpoints for autosave

The first user-originated change schedules a short debounced `POST /api/v1/recipes`. After the response supplies an identifier, later saves use `PATCH /api/v1/recipes/{id}`. The browser history entry is replaced with the existing edit URL while preserving origin state, without asking React Router to navigate or remount the active form. Refresh and history therefore restore the server-owned draft without interrupting the user's editing session. No new endpoint, dependency, table, or migration is required.

`RecipeRequest.name` becomes non-null but blank-capable. The pets service normalizes it to an empty string and accepts it only when no calculation snapshot is supplied. A calculated request with a blank name returns a validation error. Existing named clients remain compatible.

A separate partial-draft endpoint was considered, but it would duplicate the recipe contract and mapping logic. Browser-only storage was rejected because it would not make the draft available in the recipe list or across devices.

### Drive autosave from explicit dirty revisions

Form mutation helpers record a user-edit revision after initial data and reference loading completes. Initialization, pet prefill, and hydration do not create a draft by themselves. User-triggered recommendation and calculation results do count as changes and schedule an immediate save because they alter persisted fields.

The autosave controller keeps the latest payload, persisted revision, in-flight revision, timer, and draft identifier. Only one write is active at a time; if input changes during a request, the newest revision is saved immediately afterward. Response data never replaces live form state, which prevents a slow response from overwriting newer typing.

This serialized hook/state-machine approach is preferred over firing independent debounced promises because HTTP responses can complete out of order.

### Treat calculation validity and persistence as one state boundary

Existing calculation-sensitive setters continue to clear the local calculation result. Their next autosave sends no snapshot, causing the pets service to persist `draft` status. A successful explicit calculation updates the local snapshot and requests an immediate autosave; the UI reports the recipe as calculated only after persistence succeeds. Name and description changes do not invalidate a current calculation.

The calculation action retains the current non-blank name guard. This keeps blank names available for recoverable partial work without permitting an apparently complete unnamed recipe.

### Expose save state without a redundant manual-save workflow

The authoring header displays localized idle/pristine, Saving, Draft saved or Recipe saved, and Save failed states. Failure includes a Retry action and never clears the form. Explicit Save draft/Save recipe/Save changes buttons are removed; Calculate remains explicit. Internal Back/Delete actions flush a queued change before navigating. A `beforeunload` warning is registered only while data is pending or failed, since browsers cannot guarantee completion of asynchronous requests during unload.

Keeping a manual save button was considered, but it creates two competing completion models and does not satisfy automatic preservation. Retry is retained as the explicit recovery control.

### Present drafts in the existing list

The recipe list already receives `status`; it will render a compact theme-token-based Draft badge beside the name for `draft` items. Blank names are displayed as the localized Untitled recipe fallback, while edit/profile hydration keeps the stored input blank. Calculated rows need no extra badge. The row remains searchable and editable through existing routes.

A badge is preferred over an icon alone because its meaning is accessible without hover and is easier to localize. A separate drafts section was rejected because users asked to find unfinished work in the general list and the expected list is currently small.

### Localize all touched recipe text and preserve internal identifiers

Visible hard-coded Russian strings in the affected active recipe components move into the existing `ru`, `en`, and `kz` dictionaries. Sidebar order changes structurally while reusing its existing keys. Internal route state such as `food`, legacy DTO/type names, recommender terminology, and third-party FEDIAF URLs remain unchanged when they are not user-visible recipe labels.

## Risks / Trade-offs

- [Rapid changes create excess writes] -> Debounce ordinary edits and immediately persist only important generated results or navigation flushes.
- [A slow request overwrites newer input] -> Serialize writes, track revisions, and never hydrate live form state from autosave responses.
- [Route replacement interrupts the form after first create] -> Replace the browser history entry directly after the create response is durable, keeping the mounted form and its live state intact while making refresh recover the saved identifier.
- [The user closes the browser before the debounce completes] -> Use a short delay and an unload warning while work is unpersisted; do not claim guaranteed background delivery.
- [Blank names leak into other screens] -> Allow them only for input-only drafts and apply the localized fallback consistently wherever recipe list items are presented.
- [Autosave error is mistaken for success] -> Keep a persistent failed state and Retry action until the latest revision is stored.
- [Existing calculated recipe is downgraded unexpectedly] -> Invalidate and persist draft status only for fields already classified as calculation inputs; metadata-only edits retain the snapshot.

## Migration Plan

1. Update pets-service request validation and focused service tests for unnamed drafts, named calculated recipes, ownership, and status transitions.
2. Update frontend service assumptions, continuous form rendering, serialized autosave behavior, route replacement, navigation flushing, and deletion handling.
3. Add draft list presentation, reorder the sidebar, and localize every touched label in Russian, English, and Kazakh.
4. Run focused backend tests, frontend lint/build, OpenSpec validation, and final diff checks; rebuild the pets sandbox container and inspect startup logs.
5. Smoke-test first edit, rapid edits, refresh recovery, failed-save retry, leave/resume/delete behavior, calculation invalidation, list badges, all locales, themes, and mobile/desktop layouts.

Rollback deploys the previous frontend and pets-service validation. No schema rollback is required. Existing empty-name drafts remain valid database rows and the older API can still read them; operators may leave them for users to rename or remove them only through an explicitly approved cleanup.
