## ADDED Requirements

### Requirement: Filter recipes by disease across breeds

The recipe list SHALL offer alphabetically sorted, unique disease names across all breeds and existing health conditions. Selected names SHALL match the owner's recipes by stored disease name or referenced health condition name.

#### Scenario: Disease exists only in the breed catalog

- **WHEN** the owner selects a disease without a corresponding health condition reference
- **THEN** the list includes the owner's recipes with that disease stored by name

#### Scenario: Disease exists in both sources

- **WHEN** the same disease appears in the breed catalog and in the health condition reference
- **THEN** it appears once and matches either stored representation
