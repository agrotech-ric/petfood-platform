## Context

The recommender owns the breed disease catalog. Pets-service stores both a health condition reference and a disease name on a recipe.

## Decisions

- Expose the deduplicated catalog through the existing authenticated recommender route.
- Merge catalog entries with existing health conditions and sort displayed names using the UI locale.
- Filter the owner's recipes by normalized exact names, matching either stored field. Preserve the existing ID-based query parameter for existing callers.
