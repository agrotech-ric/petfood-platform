## 1. Draft Contract and Backend Rules

- [x] 1.1 Update the pets-service recipe request contract to accept a non-null blank name for input-only drafts while rejecting blank names when a calculation snapshot is supplied.
- [x] 1.2 Add focused recipe service/controller tests for unnamed draft creation and update, named calculated persistence, stale-result downgrade to draft, and existing owner isolation behavior.
- [x] 1.3 Confirm the existing non-null recipe name column and `draft`/`calculated` status fields support the change without a Flyway migration.

## 2. Continuous Recipe Authoring

- [x] 2.1 Remove create-mode step state, Continue/back-step behavior, and conditional section rendering so new and existing recipes use one continuous page.
- [x] 2.2 Keep recommendation and calculation actions on the same page, require a name before calculation, and preserve the existing invalidation rules for calculation-sensitive inputs.
- [x] 2.3 Replace visible food/feed wording on the recipe authoring and result surfaces with recipe terminology and remove redundant explicit save actions.

## 3. Autosave and Draft Recovery

- [x] 3.1 Implement a debounced, serialized autosave controller that ignores initialization, creates on the first user edit, updates the newest revision only, and immediately persists generated recommendation or calculation state.
- [x] 3.2 Replace the create URL with the persisted edit URL after the first save, preserve origin navigation state, and reload the same draft on refresh without duplicate creation.
- [x] 3.3 Add localized saving, saved, failed, and retry states; retain form values after errors; flush pending changes for internal navigation; and warn on browser unload while changes remain unpersisted.
- [x] 3.4 Make the authoring-page delete action remove an existing owned draft after confirmation while ordinary navigation keeps the draft.

## 4. Navigation, Lists, and Localization

- [x] 4.1 Reorder the sidebar items to My pets, My recipes, and Ingredients without changing their routes or active-state behavior.
- [x] 4.2 Show draft recipes in the normal list with an accessible localized Draft badge and display a localized Untitled recipe fallback for blank names without altering stored values.
- [x] 4.3 Replace remaining visible food/feed wording on the active recipe list, recipe profile, calculation summary, and pet nutrition recipe table with recipe terminology.
- [x] 4.4 Add every new or changed string to the Russian, English, and Kazakh dictionaries and use the existing language context from all touched components.
- [ ] 4.5 Style autosave indicators and draft badges with existing theme variables and verify the continuous form remains usable on desktop and mobile in standard and dark themes.

## 5. Verification and Handoff

- [x] 5.1 Run the focused pets-service tests and the full relevant backend test task; report any unavailable checks.
- [ ] 5.2 Run frontend lint and production build, then manually verify create, rapid edit, autosave failure/retry, refresh, resume, calculate, invalidate, leave, and delete flows in all three locales.
- [ ] 5.3 Rebuild the sandbox pets-service container, inspect startup and authorization logs, and smoke-test owner-only draft access through the gateway.
- [x] 5.4 Review durable documentation for workflow or contract statements, update only what changed, validate all OpenSpec artifacts, and run `git status --short`, `git diff --check`, and focused `git diff` review.
