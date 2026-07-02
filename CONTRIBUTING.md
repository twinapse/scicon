# Contributing guidelines

This document is the source of truth for repository-wide contributor policy.
It applies to human contributors and AI agents.
Agent-only workflow instructions live in [AGENTS.md](AGENTS.md).

<!-- toc -->

- [Documentation](#documentation)
- [Requirements](#requirements)
- [General guidelines](#general-guidelines)
- [Coding style](#coding-style)
- [Tests and checks](#tests-and-checks)
- [Git](#git)

## Documentation

- Project reference documentation lives in [docs](docs) and is indexed in [README.md](README.md#documentation).
- Review the relevant reference documentation before changing related behavior.
- In Markdown and `.txt` files, keep prose, including list items, to one sentence per line.
  Do not rewrap tables, code snippets, or links to fit this convention.

## Requirements

Python code and CI use **Python 3.12**.

Dependencies:

- Runtime dependencies live in `[project.dependencies]` in [pyproject.toml](pyproject.toml).
- Development check dependencies live in `[project.optional-dependencies].dev` in [pyproject.toml](pyproject.toml).
- Test dependencies live in `[project.optional-dependencies].test` in [pyproject.toml](pyproject.toml).
- Publish dependencies live in `[project.optional-dependencies].publish` in [pyproject.toml](pyproject.toml).

Install local contributor tooling with:

```bash
pip install -e '.[dev]'
```

## General guidelines

- Follow these label and identifier formatting conventions throughout the repository:
  - Use sentence case for titles, headers, and other display names throughout the repository, unless another documented convention overrides it.
  - Keep proper nouns, brands, product names, acronyms, and code identifiers capitalized as needed within sentence-case titles, headers, and labels.
  - In GitHub Actions workflows:
    - Use sentence case for workflow `name` values, job `name` values, and step `name` values.
    - Use kebab-case for GitHub Actions job IDs.
    - Use snake_case for GitHub Actions step IDs.
    - Use lowercase for GitHub Actions environment names such as `development`, `staging`, and `production`.

## Coding style

We follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) and the [Google Python Style Guide](https://github.com/google/styleguide/blob/gh-pages/pyguide.md).
Check [pylintrc](pylintrc) and [.style.yapf](.style.yapf) for the specific rules enforced in this repository.

When Python code exists, use the following tools for consistency with local development and CI:

```bash
isort scicon tests --profile google --line-length 88
yapf --recursive --in-place scicon tests
ruff check scicon tests --fix
pylint --rcfile=pylintrc scicon
pylint --rcfile=pylintrc --disable=redefined-outer-name,unused-argument,protected-access tests
```

If the set of Python paths changes, update these commands and the documentation in the same change.

### Formatting

- Use 4-space indentation.
- Use Ruff's default line length for Python code: 88 characters.
- Use single quotes for string literals by default.
- Use double quotes only when it avoids awkward escaping.
- Prefer `f`-strings over `%` formatting or `.format(...)`, except in logging calls.
- Use lazy `%` formatting in logging calls, such as `logger.info('message %s', value)`.
- Break dense function signatures and calls across multiple lines.
- When a call or expression becomes dense, break it across lines clearly and consistently.

Example:

```python
manifest_key = 'manifest.yaml'
error = f'Unsupported evidence status: {status}'
label = "Author's confirmation"

messages = run_validation(
    package_root=package_root,
)
```

Avoid:

```python
manifest_key = "manifest.yaml"
error = 'Unsupported evidence status: {}'.format(status)
label = 'Author\'s confirmation'
```

When a call or expression becomes dense, break it across lines clearly and consistently:

```python
report = format_validation_report(
    package_path=str(package_root),
    messages=messages,
)
```

Avoid:

```python
report = format_validation_report(package_path=str(package_root), messages=messages)
```

### Typing and arguments

- All functions and methods must include type hints, including return types.
- Prefer keyword arguments for multi-parameter calls and public APIs.
- Use keyword-only parameters (`*`) when named call sites improve readability or safety.
- Single obvious parameters may stay positional.
- Preserve framework-prescribed signatures when external integrations depend on them.
- Prefer keyword arguments for dense calls when they improve readability.

Example:

```python
from pathlib import Path


def load_yaml_file(package_root: str | Path, filename: str) -> dict[str, object]:
    ...


def trace_claim_to_evidence(*, claim_id: str) -> dict[str, object]:
    ...
```

Avoid:

```python
def load_yaml_file(package_root, filename):
    ...


def trace_claim_to_evidence(claim_id):
    ...
```

Prefer keywords for dense calls:

```python
report = format_validation_report(
    package_path=str(package_root),
    messages=messages,
)
```

Avoid:

```python
report = format_validation_report(str(package_root), messages)
```

Single obvious arguments may remain positional:

```python
package_root = resolve_package_dir(package_dir)
```

Framework-specific note:

- Preserve signatures that are dictated by a public CLI, MCP adapter, or interface contract.

### Docstrings and comments

- Use Google-style docstrings with `Args`, `Returns`, and `Raises` when relevant.
- Use the newline-after-opening-quotes style: the opening `"""` is on its own line and the summary starts on the next line.
- Include type information in docstring sections.
- Indent docstring field descriptions after the section labels.
- Use triple double quotes only for docstrings.
- Use `#` comments for inline notes and lightweight banner comments for major sections.
- Avoid same-line summary docstrings and triple-quoted block comments that are not real docstrings.

Example:

```python
from pathlib import Path


def resolve_package_file(package_root: Path, relative_path: str) -> Path:
    """
    Resolve a package-relative file path.

    Args:
        package_root (Path): Root of the SCP package.
        relative_path (str): Package-relative path declared in metadata.

    Returns:
        Path: Absolute path to the package file.

    Raises:
        ValueError: If the resolved path escapes the package root.
    """
```

Avoid:

```python
def resolve_package_file(package_root: Path, relative_path: str) -> Path:
    """Resolve a package-relative file path."""


"""
Path helpers
"""
```

Use `#` comments or banner comments instead:

```python
######################
# Validation helpers #
######################

# Keep path-traversal failures explicit in validation output.
```

### Imports and exports

- Do not use `from __future__ ...` imports.
- Use absolute imports; avoid relative imports.
- Group imports as stdlib, third-party, then project imports.
- Keep imports alphabetized within each group.
- Import one symbol per line, except for `typing` imports.
- Declare `__all__` immediately after imports in modules that export a public surface.
- Keep one line per exported symbol in `__all__`.
- Keep `__all__` in sync when adding or removing public exports.

Example:

```python
from pathlib import Path
from typing import Any

import yaml

from scicon.schema.status import EvidenceStatus
from scicon.validation.results import ValidationMessage

__all__ = [
    'EvidenceStatus',
    'ValidationMessage',
]
```

Avoid:

```python
from __future__ import annotations
from .results import ValidationMessage
from scicon.validation.results import ValidationMessage, format_validation_report
```

### Naming

- Use `snake_case` for functions, variables, and modules.
- Use `PascalCase` for classes and enums.
  Keep acronyms fully capitalized inside those names, such as `SCPPackage` or `TestMCPServer`.
- Use `ALL_CAPS` for constants.
- Keep names aligned with SCP domain language.
- Before coining a new name for a concept, search the codebase for an existing term and reuse it instead of inventing a synonym.

Repository-shaped examples:

```python
def resolve_package_dir(package_dir: str | Path | None = None) -> Path:
    ...


class EvidenceStatus:
    ...


MANIFEST_FILENAME = 'manifest.yaml'
```

### Reuse

- Before introducing a new abstraction (helper, wrapper, indirection layer, config option, or type), search the codebase for an existing one that already covers the same concept and reuse or extend it.
- Search by behavior, not only by the name you intend to use: a duplicate helper often already exists under a different name.
  Look for the inputs, outputs, and operation before writing a new one.
- Put a genuinely new helper in the module where related helpers already live instead of creating a parallel location for it.
- Prefer the smallest change that fits the current design over a more general one.
  When in doubt, do not add the new abstraction.

## Tests and checks

Run relevant tests before opening or updating a PR.
The default command is:

```bash
pytest
```

Use focused test paths while iterating:

```bash
pytest tests/unit/test_loader.py
```

Group logically related pytest tests in `Test*` classes.
Keep standalone test functions only when they are truly isolated.

For a local verification pass that matches CI closely, run:

```bash
isort scicon tests --profile google --line-length 88
yapf --recursive --diff scicon tests
ruff check scicon tests
pylint --verbose --rcfile=pylintrc scicon
pylint --verbose --rcfile=pylintrc --disable=redefined-outer-name,unused-argument,protected-access tests
python -m pytest -q tests -ra --maxfail=1
```

Prefer tests that cover:

- Schema normalization and required fields.
- Paper-section resolution and manifest optional fields.
- Evidence-status preservation.
- Broken package links and path traversal safeguards.
- Figure, claim, dataset, method, and code-artifact provenance links.
- MCP tools/resources and not-enough-information behavior.
- Operation recipes remaining descriptive with `execution_supported: false`.

The CI workflow in [.github/workflows/run-tests.yaml](.github/workflows/run-tests.yaml) runs tests with Python 3.12 and the `test` extra.

The CI workflow in [.github/workflows/format-and-lint.yaml](.github/workflows/format-and-lint.yaml) runs isort, YAPF, Ruff, and Pylint against available Python paths with the `dev` extra.

## Git

A clean Git history makes it easier to understand why a change was made and what behavior it affects.

### Commits

Write the commit header as a user-facing release-note fragment.
Each PR is squash-merged into one commit on `main`, the PR title becomes that commit header, and [Release Please](https://github.com/googleapis/release-please) publishes it as the changelog entry.

Use the Conventional Commits structure as the commit message format:

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Follow these rules for each part of the message:

1. **Header** — `<type>[optional scope]: <description>`
   - The whole header is published as-is in the changelog, so write it as a clear, user-facing release-note fragment.
   - **Type**
     - Use one of the types configured for Release Please:
       - `build`: build-system or packaging change
       - `chore`: maintenance or tooling change
       - `ci`: continuous-integration change
       - `docs`: documentation-only change
       - `feat`: new feature
       - `fix`: bug fix
       - `perf`: performance improvement
       - `refactor`: code restructuring without behavior change
       - `revert`: reversion of an earlier change
       - `style`: non-behavioral formatting or style-only change
       - `test`: test-only change
     - `feat`, `fix`, `perf`, and `revert` appear in the changelog.
     - `build`, `chore`, `ci`, `docs`, `refactor`, `style`, and `test` remain hidden from the changelog unless they carry a breaking-change signal.
   - **Scope (optional)**
     - Use a narrow, meaningful scope such as `cli`, `interface`, `package`, `schema`, `validation`, or `mcp-server`.
   - **Breaking change (optional)**
     - Append `!` immediately before the `:` to flag a breaking change, for example `feat(cli)!:`.
     - A breaking change may use any commit type.
   - **Description**
     - Keep the whole header at 72 characters or fewer.
     - Use imperative mood.
     - Start with a lowercase word unless the first word is a proper noun, brand, acronym, or code identifier.
     - Do not end it with a period.

2. **Body** — `[optional body]`
   - Explain what changed and why.
   - For non-trivial commits, add a short bullet list introduced by `Changes:`, starting each item with a capital letter.
   - Under the repository squash settings, a single-commit PR carries the full commit message to `main`, so the body is the git-native place for the "why".

3. **Footers** — `[optional footer(s)]`
   - Use an uppercase `BREAKING CHANGE:` footer as the secondary way to describe a break flagged by `!`.
   - Link issues in the PR description with `Closes #NN` instead of using a `Refs:` footer.

Also make sure to:

- Be specific about the affected subsystem or behavior.
- Keep each commit focused on one logical change.
- Use backticks for code references such as function names, class names, commands, and file paths.
- Apply these same header rules to PR titles, because the PR title becomes the squash commit header.

Example commit message:

```text
fix(package): harden package path checks

Reject package-relative paths that escape the package root so package reads
remain confined to hand-authored SCP artifacts.

Changes:
- Reject absolute or escaping package file paths in `resolve_package_file`
- Cover traversal failures in `tests/unit/test_paths.py`
```

### Pull requests (PRs)

Write the PR title and description so the change is understandable without opening the diff first.
Each PR is squash-merged into one commit on `main`.
With the repository settings in [docs/releasing.md](docs/releasing.md#github-settings), GitHub uses the PR title plus `(#NN)` as the squash subject.

#### Title

Format:

```text
<type>[optional scope][optional !]: <description>
```

Example:

```text
fix(validation): reject unknown provenance predicates
```

Guidelines:

1. Follow the commit header rules above.
2. Use imperative mood and be specific about the affected subsystem or behavior.
3. Use `!` before the `:` as the primary CI-verifiable signal for a breaking change.
4. Avoid unnecessary punctuation or decoration.

#### Description

Include:

- A `Summary` section that starts with a short paragraph and may be followed by bullets.
- A `Motivation` section that starts with a short paragraph and may be followed by bullets.
- Important context or constraints.
- A categorized list of breaking changes, new features, behavior changes, fixes, refactors, or documentation updates.
- The tests that were added or updated to cover the changes.
- `Closes #NN` when the PR resolves an issue.

Make sure to:

- Start with a capital letter and end with a period in each bullet.
- Use backticks for code references, identifiers, and file paths.

The PR description may summarize the commits, but git history is the source of truth for the durable change record.

Example PR description:

```markdown
## Summary

This change makes package validation fail with a clear error when `provenance.yaml` contains a predicate outside the declared vocabulary.

## Motivation

Package authors hand-write typed provenance edges, so invalid predicates should be caught early with feedback that points directly at the broken package data.

## Behavior changes

- Reject unsupported predicates during `scicon.validation.checks.run_validation`.
- Keep valid `provenance.yaml` edges passing without additional warnings.

## Tests

- Run `python -m pytest -q tests/unit/test_validation.py -ra`.
- Cover invalid predicates and existing valid-package behavior.

Closes #123
```

#### Breaking changes

Use `!` in the PR title as the primary signal for breaking changes.
Use a `BREAKING CHANGE:` footer as the secondary signal when a longer explanation is useful.
Before `1.0.0`, breaking changes drive a minor version bump.

#### Changelog links

Squash-merge appends `(#NN)` to the commit subject.
Release Please's default notes builder renders that suffix as the PR link and also links the commit.
Do not set `changelog-type: github`, because that would drop the configured sentence-case commit-type sections.

#### Enforcement

A semantic PR title check such as `amannn/action-semantic-pull-request` is recommended.
With the required repository settings, that check validates the squash subject before merge.
The residual gap is that a merger can hand-edit the squash message, which GitHub cannot lock.
Accept that residual gap.

### Releases

Release automation is documented in [docs/releasing.md](docs/releasing.md).
Release Please consumes the Conventional Commit types described above to maintain the changelog and choose release bumps.
