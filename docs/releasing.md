# Releasing

This guide documents how `scicon` releases are prepared before publishing to PyPI.

<!-- toc -->

- [Release flow](#release-flow)
- [Versioning](#versioning)
- [Changelog](#changelog)
- [GitHub settings](#github-settings)
- [Token requirements](#token-requirements)

## Release flow

1. Contributors open PRs with Conventional Commit titles.
2. Each PR is squash-merged into one commit on `main`, so exactly one Conventional Commit lands there.
3. release-please reads the commits on `main` and maintains a release PR.
4. The release PR updates `CHANGELOG.md` and `.release-please-manifest.json`.
5. After the release PR is merged, release-please creates the GitHub release and the `vX.Y.Z` tag.
6. The tag-triggered PyPI workflow builds the package with hatch-vcs.
7. hatch-vcs derives the package version from the tag, so the tag, changelog version, and published package version match.

## Versioning

- Release tags use the `vX.Y.Z` form.
- The git tag is the single source of truth for the package version.
- To force an exact next version, add a `Release-As: X.Y.Z` footer to the commit body that lands on `main`.
  Use `Release-As` sparingly for bootstrapping or exceptional corrections because it bypasses the normal version bump calculation.
- The `0.x` line is the alpha phase.
  - Before `1.0.0`, breaking changes bump the minor version.
  - Before `1.0.0`, feature and fix changes bump the patch version.
  - Version `1.0.0` marks leaving alpha when the CLI, MCP, and package schema surfaces are stable.

## Changelog

- `CHANGELOG.md` is managed by release-please.
- The changelog follows Keep a Changelog principles through release-please commit-type sections rather than literal Keep a Changelog categories.
- The explicit `changelog-sections` list in [release-please-config.json](../release-please-config.json) mirrors the section titles and hidden flags from the [`conventional-changelog-conventionalcommits` preset constants](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-conventionalcommits/src/constants.js) that release-please uses for its default changelog sections.
  Keep `changelog-sections` aligned with the upstream preset unless the repository intentionally wants changelog grouping that diverges from the release-please default.
- The release notes use the Conventional Commit descriptions that land on `main`.
- A commit with `Release-As` may still appear in `CHANGELOG.md` even when its commit type would otherwise be hidden.
- release-please links entries to the squash-merged PR through the `(#NN)` suffix and to the commit.

## GitHub settings

- Allow only `Squash and merge` for pull requests.
- Set the squash default commit message to `Pull request title and commit details`.
  - The squash commit subject is the PR title plus `(#NN)`.
  - The squash commit body is the commit message for a single-commit PR or the commit list for a multi-commit PR.
  - A merger can still hand-edit the squash message, which GitHub cannot lock.
- The PR title must be a Conventional Commit header because it becomes the changelog entry.
- A semantic PR title check that fails non-conventional titles is a recommended safeguard and may be deferred.
- Use PR descriptions for review context such as summary, motivation, changes, tests, and `Closes #NN` issue links.
- If a PR needs `Release-As`, add it to the squash commit body that lands on `main`, not to the release PR description.
- Git history remains the durable change record.

## Token requirements

- The release-please workflow must use `secrets.RELEASE_PLEASE_TOKEN` or an equivalent non-default GitHub App or PAT secret.
- The token must allow release-please to create release PRs, tags, and releases.
- Do not rely on the default `GITHUB_TOKEN` for release-please tags.
  Tags and PRs created with the default `GITHUB_TOKEN` do not trigger downstream GitHub Actions workflows.
- If the project cannot provide a non-default release-please token, replace tag-triggered publishing with publication inside the release-please workflow.
