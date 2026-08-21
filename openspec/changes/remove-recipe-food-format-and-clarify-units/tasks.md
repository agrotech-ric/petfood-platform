## 1. Recipe Contract and Persistence

- [x] 1.1 Remove recipe format from pets-service request and response DTOs, entity mapping, service mappings, list filters, and supported sort fields.
- [x] 1.2 Add the next pets-service Flyway migration to drop the recipe format constraint, index, and `food_format` column while preserving all other recipe data.
- [x] 1.3 Update focused pets-service tests to cover format-neutral create, update, list, filtering, sorting, and existing-recipe response behavior.

## 2. Format-Neutral Frontend

- [x] 2.1 Remove recipe format from frontend recipe types, payload construction, form state, edit hydration, and service list parameters.
- [x] 2.2 Remove wet/dry controls, filters, table columns, pet nutrition values, and recipe profile metadata from every active recipe screen.
- [x] 2.3 Search the active beta frontend and pets recipe service for obsolete wet/dry recipe-format references and remove any remaining contract or presentation usage without changing recommender source-data categories.

## 3. Measurement Presentation

- [x] 3.1 Add Russian, English, and Kazakh dictionary entries for recipe constraint units, per-100-gram energy, per-100-gram nutrient units, and affected recipe labels.
- [x] 3.2 Display nutrient constraints as grams per 100 grams and calculated energy as kilocalories per 100 grams in both pre-save and saved recipe results.
- [x] 3.3 Display each normalized calculated nutrient using its returned unit per 100 grams while keeping daily energy targets, daily feeding amounts, and stored numeric values unchanged.

## 4. Documentation and Verification

- [x] 4.1 Review durable architecture and API documentation for obsolete recipe format or measurement claims and update only the relevant documentation if needed.
- [x] 4.2 Run the focused pets-service test suite, frontend lint and build, and OpenSpec validation.
- [x] 4.3 Rebuild the sandbox pets-service container, inspect Flyway and startup logs, and smoke-test new and existing recipe flows across Russian, English, and Kazakh plus desktop/mobile and light/dark presentation.
- [x] 4.4 Run `git status --short`, `git diff --check`, and focused `git diff` review, preserving the user's existing `README.md` and `docs/assets/` changes.
