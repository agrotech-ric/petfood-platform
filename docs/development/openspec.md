# Working with OpenSpec in the Codex IDE Extension

OpenSpec is the repository's lightweight process for agreeing on significant
changes before implementation. It stores proposals, observable requirements,
technical design, and implementation tasks as versioned Markdown.

The project uses OpenSpec `1.8.0`, the `spec-driven` schema, and the `core`
workflow profile. All repository artifacts, including OpenSpec files, are
written in English. Conversation with Codex may use any language.

This guide assumes that the repository is open in Cursor IDE and work is done
through the OpenAI Codex extension, not Cursor's built-in agent.

## One-time setup

Open the repository root as the IDE workspace, then restart Cursor after
checking out the OpenSpec files. Start a new Codex chat so the extension can
discover the repository skills under `.agents/skills/`.

OpenSpec commands are packaged as Codex skills. In the Codex composer, invoke a
skill by typing its `$` name, or ask for the same workflow in plain language.
The `/opsx-*` commands under `.cursor/commands/` are for Cursor's own agent and
are not the primary interface when using the Codex extension.

## When OpenSpec is required

Use OpenSpec for:

- new user-facing capabilities;
- changes to observable behavior or acceptance criteria;
- API contracts or database schemas;
- authentication, authorization, privacy, or other security work;
- cross-service changes and meaningful architectural refactors;
- production changes with migration, compatibility, or rollback risk.

OpenSpec is optional for typos, documentation clarification, mechanical
maintenance, and small local fixes whose expected behavior is already
unambiguous.

## Workflow in Codex

### 1. Explore an unclear idea

Start a Codex chat and enter:

```text
$openspec-explore

I want to improve session security, but first investigate the current flow,
risks, and possible scope. Do not create a change yet.
```

Exploration reads the repository and helps refine the problem without creating
OpenSpec artifacts. Use it when the goal or boundaries are still uncertain.

### 2. Create a change proposal

When the intended outcome is clear, enter:

```text
$openspec-propose

Remove authentication secrets from application logs. Cover registration,
two-factor authentication, password reset, gateway session exchange, and pet
creation. Do not change externally visible API behavior.
```

Codex creates a directory under `openspec/changes/<change-name>/` containing:

- `proposal.md`: problem, scope, non-goals, and impact;
- `specs/<domain>/spec.md`: added, modified, or removed behavior;
- `design.md`: technical approach, risks, migration, and rollback;
- `tasks.md`: ordered and verifiable implementation tasks.

Do not start implementation immediately. Review these files in the editor.
Check that the scope is small enough, scenarios are testable, non-goals are
explicit, and security/data consequences are covered.

### 3. Revise the proposal

Ask Codex to update the existing change when review reveals a missing decision:

```text
$openspec-update-change

Update the active change: log messages may retain event type and correlation
ID, but must not contain email addresses, OTPs, JWTs, SIDs, or cookies. Add this
to the specs, design, and tasks.
```

This workflow changes planning artifacts only. Continue reviewing until the
proposal, specs, design, and tasks agree with one another.

### 4. Implement the approved change

After approval, enter:

```text
$openspec-apply-change

Implement the approved change. Preserve unrelated working-tree changes and run
all verification listed in its tasks.
```

Codex reads the active change, implements its tasks, and updates task status.
If implementation invalidates an assumption, stop and revise the artifacts with
`$openspec-update-change` before continuing.

### 5. Review and verify

Before archiving:

1. Review `git diff` in Cursor.
2. Compare the implementation with every scenario in the delta specs.
3. Run the checks required by `docs/development/verification.md`.
4. Confirm that every task is complete or explicitly removed from scope.
5. Use Codex `/review` for a separate code-review pass when the change carries
   meaningful risk.

`/review` is a built-in Codex IDE command; it is separate from OpenSpec.

### 6. Archive the completed change

When implementation and verification are complete, enter:

```text
$openspec-archive-change

Archive the completed change and sync its accepted behavior into the main
specifications.
```

Archiving updates `openspec/specs/` and moves the complete change history to
`openspec/changes/archive/<date>-<change-name>/`.

For a long-running change, `$openspec-sync-specs` can merge accepted delta specs
before archival. Most changes do not need a separate sync step because archive
handles it.

## Skill reference

| Codex skill | Purpose | Produces code |
| --- | --- | --- |
| `$openspec-explore` | Investigate and clarify an idea | No |
| `$openspec-propose` | Create proposal, specs, design, and tasks | No |
| `$openspec-update-change` | Revise existing planning artifacts | No |
| `$openspec-apply-change` | Implement approved tasks | Yes |
| `$openspec-sync-specs` | Merge delta specs into main specs | No |
| `$openspec-archive-change` | Finalize and archive a completed change | No |

If a `$openspec-*` skill does not appear or activate, verify that Cursor opened
the repository root, restart the IDE, and start a new Codex chat. The extension
discovers skills from their metadata and loads full instructions when the user
request matches or the skill is invoked directly.

## CLI commands

The Codex skills drive the normal workflow. The OpenSpec CLI is used for status,
validation, and generated integration updates.

OpenSpec requires Node.js 20.19 or later. The current host Node is older, so run
the pinned CLI through Node 22 Docker from the repository root:

```bash
docker run --rm -it \
  -e OPENSPEC_TELEMETRY=0 \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:22-bookworm-slim \
  npx -y @fission-ai/openspec@1.8.0 <command>
```

Useful commands:

```bash
# List active changes
docker run --rm -e OPENSPEC_TELEMETRY=0 -v "$PWD:/workspace" \
  -w /workspace node:22-bookworm-slim \
  npx -y @fission-ai/openspec@1.8.0 list

# Validate all changes and specifications
docker run --rm -e OPENSPEC_TELEMETRY=0 -v "$PWD:/workspace" \
  -w /workspace node:22-bookworm-slim \
  npx -y @fission-ai/openspec@1.8.0 validate --all

# Refresh generated Codex and Cursor integrations after an OpenSpec upgrade
docker run --rm -it -e OPENSPEC_TELEMETRY=0 -v "$PWD:/workspace" \
  -w /workspace node:22-bookworm-slim \
  npx -y @fission-ai/openspec@1.8.0 update
```

Developers with a compatible local Node installation may use:

```bash
npm install -g @fission-ai/openspec@1.8.0
openspec list
openspec validate --all
```

Do not type `openspec ...` CLI commands into the Codex composer. Conversely,
`$openspec-*` skills belong in the Codex composer, not the terminal.

## Repository structure

```text
openspec/
├── config.yaml                  project context and artifact rules
├── specs/<domain>/spec.md       current observable system behavior
└── changes/
    ├── <change-name>/           active change artifacts
    └── archive/                 completed change history

.agents/skills/                  generated Codex OpenSpec skills
.cursor/commands/                generated commands for Cursor's own agent
.cursor/skills/                  generated skills for Cursor's own agent
```

Generated files should be refreshed with the project's pinned OpenSpec version.
Review generated diffs before committing. Docker-created files may need their
ownership restored to the current user.

## Brownfield adoption

Do not attempt to reconstruct the complete existing system specification up
front. Start with the next meaningful change. Its archived delta becomes the
first durable specification for that domain. Add baseline specs only when they
are necessary to remove ambiguity from upcoming work.

`openspec/specs/` describes current observable behavior. Architecture and setup
remain in `docs/`; mandatory agent behavior remains in `AGENTS.md`. Avoid
duplicating the same information across these locations.
