# Validation guide

Validation shows whether a hand-authored SCP package is grounded enough for `scicon serve`.
It does not imply that the science is correct or that the schema is complete.

<!-- toc -->

- [Required checks](#required-checks)
- [Severity levels](#severity-levels)
- [Validation report](#validation-report)

## Required checks

The validator checks:

- The package root exists and contains `manifest.yaml`.
- Known YAML files parse.
- Object IDs are unique.
- Edge IDs are unique.
- Every edge in `provenance.yaml` uses a predicate from the declared closed vocabulary.
- Every edge subject and object resolves to a known object ID, including stub entries.
- Every edge predicate is legal for the resolved subject and object types.
- Claim `section` values resolve to a known `paper.yaml` section where paper structure is represented, or are marked missing, ambiguous, or unresolved.
- Evidence statuses use known values.
- Confidence values use `high`, `medium`, or `low`.
- Removed inverse relationship fields do not appear in package files.
- Stub objects are valid when they keep only `id` plus unresolved, missing, or ambiguous status.
- Missing, ambiguous, and unresolved information is reported in the validation summary.

Removed inverse relationship fields include `supporting_figures`, `supporting_datasets`, `supporting_code`, `supporting_methods`, claim-level `assumptions`, `source_data`, `analysis_code`, nested figure `claims`, nested figure `methods`, `related_figures`, `related_claims`, `affected_claims`, `affected_figures`, `affected_methods`, `reused_methods`, and `related_artifacts`.

Paper-section `related_claims` and `related_figures` remain allowed because they are intrinsic document-map fields.
Cross-object support and provenance still belong in `provenance.yaml`.

## Severity levels

- `error`: The package contract is broken.
- `warning`: Information is missing, ambiguous, or incomplete but partial use is still possible.
- `info`: Useful context or coverage statistics.

Validation messages include the package file, object ID, field name, message, and suggested fix when available.

## Validation report

Each validation run produces a short report with:

- Package path.
- Error, warning, and info counts.
- Detailed validation findings.
- Coverage of claims, figures, datasets, methods, code artifacts, assumptions, related work, operation recipes, and provenance edges.
- Missing, ambiguous, and unresolved fields.

`scicon serve` fails fast when validation reports any `error` message.
`scicon validate` exits non-zero for the same reason.
