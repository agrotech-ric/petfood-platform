## 1. Shared Calculation Flow

- [x] 1.1 Expose the existing optimizer action and calculation result on the ingredient step for both new and existing recipes, preserving loading, duplicate-request prevention, error handling, and result scrolling.
- [x] 1.2 Add focused invalidation of the calculation result and version for every optimizer input while preserving the result for name and description edits.
- [x] 1.3 Pass the current calculation result and version through the new-recipe create payload so calculated ingredient percentages and grams are persisted, while retaining save-without-calculation behavior.

## 2. User Interface and Localization

- [x] 2.1 Separate the ingredient-step calculation and save actions with clear enabled, disabled, and progress states for the create flow.
- [x] 2.2 Add all new calculation and save UI strings to the Russian, English, and Kazakh dictionaries and consume them through the existing translation context.
- [x] 2.3 Verify the controls and result remain usable on desktop and mobile layouts in standard and dark themes.

## 3. Verification

- [x] 3.1 Manually verify successful pre-save calculation, failed calculation recovery, duplicate-request prevention, save with a current result, and save without a result.
- [x] 3.2 Manually verify that each optimizer input invalidates a prior result, while recipe name and description edits preserve it, under `ru`, `en`, and `kz` locales.
- [x] 3.3 Run frontend lint and production build, validate all OpenSpec artifacts, then review `git status`, `git diff`, and `git diff --check` for focused changes.
