# Coding agent instructions

This file contains instructions for coding agents working on this repository.

Shared contributor policies such as formatting, typing, docstrings, imports, naming, and Git conventions live in [CONTRIBUTING.md](CONTRIBUTING.md).
Follow that document for all rules that apply to both humans and agents.

Reference documentation, including project context and architecture guidance, lives in the [docs](docs) directory.
[CONTRIBUTING.md](CONTRIBUTING.md#documentation) briefly explains each file in that directory.

Review the relevant reference documentation before changing related behavior.

## Python environment setup

Before running any Python-related command, activate the repository virtual environment specified by the `VIRTUAL_ENV` environment variable.
If `VIRTUAL_ENV` is not available, or if activation fails for any reason, stop immediately and exit without proceeding further.
Only continue with the task after activation succeeds, and show a message confirming that activation succeeded.

Do not install Python packages globally.
Install or run tools only inside the activated virtual environment.

## Agent workflow

- Keep diffs minimal.
- Do not reformat unrelated files.
- Limit changes to the files and behavior required for the task.
- Reuse existing vocabulary: follow the [naming rules](CONTRIBUTING.md#naming) and reuse an established term over coining a synonym.
- Reuse existing structure: follow the [reuse rules](CONTRIBUTING.md#reuse) and prefer extending an existing helper, module, or pattern over introducing a parallel abstraction.
  When in doubt, do not add the new concept.
- `scicon init` is the sanctioned bootstrap entry point for writing managed SCP setup files into the user's repository.
- Do not convert inferred, mined, or ambiguous metadata into confirmed package truth without source evidence or author confirmation.
- Keep schema, package, validation, and interface concerns separate.
- Treat final-protocol context in `docs/protocol.md` as reference material.
  Do not implement protocol features beyond [README.md](README.md#current-status) unless the task explicitly asks for a scope change.
- Treat these instructions as additive to the shared repository policies in [CONTRIBUTING.md](CONTRIBUTING.md).

## Verification

After completing a task, double-check the diff for correctness and adherence to these instructions before declaring the task done.

### Self-review

Before running checks, review the diff and confirm:

- The change is correct and limited to what the task required.
- No new name was coined for a concept that already has an established term, following the [naming rules](CONTRIBUTING.md#naming).
- No new abstraction was introduced where an existing one could be reused or extended, following the [reuse rules](CONTRIBUTING.md#reuse).
  Confirm this by searching for existing helpers by behavior, not only by the name you chose, so a differently named duplicate is not missed.

### Required checks

- For Python or behavior changes, run the relevant formatting, lint, and test commands from [CONTRIBUTING.md](CONTRIBUTING.md#tests-and-checks).
- Prefer focused checks while iterating, then run the broader relevant checks before declaring the task done.
- For documentation-only changes, inspect the diff for correctness, accuracy, and compliance with the sentence-per-line documentation convention even when no code checks are needed.
