## Purpose

Provide a continuous, recipe-first authoring experience that preserves incomplete work and makes saved draft state clear and recoverable to the recipe owner.

## ADDED Requirements

### Requirement: Primary recipe navigation is ordered by user workflow
The authenticated primary navigation SHALL present My pets, My recipes, and Ingredients in that order, using the active locale for every label.

#### Scenario: User opens the primary navigation
- **WHEN** an authenticated user views the expanded sidebar
- **THEN** My pets is followed by My recipes and then Ingredients
- **THEN** selecting an item opens the corresponding existing route

### Requirement: Recipe surfaces use recipe terminology
The system SHALL describe user-authored recipes as recipes rather than food or feed across recipe lists, recipe authoring, calculation summaries, pet nutrition recipe tables, and recipe profiles. All affected text SHALL be supplied in Russian, English, and Kazakh through the existing localization system.

#### Scenario: User views a recipe workflow
- **WHEN** a user views any active recipe list, authoring, calculation, pet nutrition recipe, or recipe profile surface in a supported locale
- **THEN** headings, field labels, actions, validation messages, and measurement descriptions use recipe terminology in that locale

#### Scenario: Domain-specific feeding quantity is displayed
- **WHEN** a calculation displays the daily amount produced from a recipe
- **THEN** the label identifies it as the daily recipe portion rather than calling the recipe itself food or feed

### Requirement: Recipe authoring uses one continuous page
The system SHALL present recipe details, pet and health parameters, recommendation controls, ingredient selection, constraints, calculation controls, and calculation results on one continuous authoring page. The user MUST be able to edit any visible field without moving between wizard steps.

#### Scenario: User starts a new recipe
- **WHEN** the user selects Add recipe
- **THEN** the complete authoring form is available on one page
- **THEN** no Continue or previous-step action is required to reach ingredients or calculation

#### Scenario: Recommendation input changes
- **WHEN** a user changes an earlier pet or health parameter after selecting ingredients
- **THEN** the user remains on the same page and can update recommendations or recalculate from the revised inputs

#### Scenario: Existing recipe is edited
- **WHEN** a user opens an existing draft or calculated recipe for editing
- **THEN** the same continuous page is populated with the saved values

### Requirement: Incomplete recipe work is autosaved as an owned draft
After an authenticated user makes the first user-initiated change on a new recipe page, the system SHALL automatically create an owner-scoped draft after a short debounce and SHALL automatically persist subsequent changes. Autosave requests MUST use the authenticated owner identity, MUST be serialized so an older response cannot overwrite newer input, and MUST NOT start recipe optimization.

#### Scenario: First meaningful edit
- **WHEN** the user changes any recipe field on a pristine new-recipe page
- **THEN** the system creates a draft without requiring an explicit save action
- **THEN** the current form values remain on the page

#### Scenario: User types or adjusts several fields quickly
- **WHEN** multiple changes occur within the debounce interval
- **THEN** the system coalesces them into a save of the latest form state
- **THEN** an earlier save response cannot replace more recent input

#### Scenario: Another user requests the draft
- **WHEN** an authenticated user requests a draft owned by a different account
- **THEN** the system returns the same not-found behavior used for other private recipes

#### Scenario: Autosave fails
- **WHEN** a draft create or update request fails
- **THEN** the current form values remain available
- **THEN** the interface shows a localized failure state with an explicit retry action

### Requirement: Autosave state is visible and navigation-safe
The authoring page SHALL expose localized saving, saved, and failed states. Once the first draft save succeeds, the current browser location SHALL identify the persisted recipe so a refresh resumes the same draft. Internal navigation SHALL attempt to flush pending changes, and the browser SHALL warn before unloading while changes remain unsaved or a save has failed.

#### Scenario: Autosave is in progress
- **WHEN** a draft request is pending
- **THEN** the authoring page displays a non-blocking Saving state

#### Scenario: Autosave succeeds
- **WHEN** the latest draft state has been persisted
- **THEN** the page displays a Draft saved state
- **THEN** refreshing the current location loads that same draft

#### Scenario: User leaves through application navigation
- **WHEN** the user activates Back or another application navigation action while changes are pending
- **THEN** the system attempts to persist the latest state before completing navigation

#### Scenario: Browser unloads with unpersisted changes
- **WHEN** the browser is about to unload while a save is pending or failed
- **THEN** the browser presents its standard unsaved-changes warning

### Requirement: Drafts are distinguishable and can be untitled
Input-only drafts SHALL permit a blank stored name and SHALL appear in the owner's normal recipe list with a localized Draft badge. A blank draft name SHALL be presented as a localized Untitled recipe fallback without replacing the user's stored input. A recipe with a calculation result MUST have a non-blank name.

#### Scenario: User leaves an untitled draft
- **WHEN** an autosaved input-only draft has no name and the user returns to the recipe list
- **THEN** the list includes the draft using the localized Untitled recipe fallback
- **THEN** the row displays a localized Draft badge

#### Scenario: User resumes an untitled draft
- **WHEN** the user opens the untitled draft from the recipe list
- **THEN** the authoring page loads the saved fields and keeps the name input blank

#### Scenario: User calculates an unnamed recipe
- **WHEN** the user requests calculation while the recipe name is blank
- **THEN** the system keeps the draft and asks for a recipe name without storing it as calculated

#### Scenario: Calculated recipe is listed
- **WHEN** a recipe has a current persisted calculation result
- **THEN** it is not marked with the Draft badge

### Requirement: Discarding a persisted draft is explicit
Leaving the authoring page SHALL keep an autosaved draft. Deleting from the authoring page SHALL require the existing destructive confirmation behavior when a persisted draft exists and SHALL remove only that owner's selected draft.

#### Scenario: User navigates away
- **WHEN** a user leaves a recipe that has been autosaved
- **THEN** the draft remains in the recipe list for later continuation

#### Scenario: User deletes the current draft
- **WHEN** the owner confirms deletion of the persisted draft
- **THEN** the system removes the draft and returns the user to the originating recipe context
