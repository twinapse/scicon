# Package schema

This document describes the package shape read by `scicon serve`.
It is not a complete standard.

<!-- toc -->

- [Top-level files](#top-level-files)
- [Evidence statuses](#evidence-statuses)
- [provenance.yaml typed edges](#provenanceyaml-typed-edges)
  - [Predicate vocabulary](#predicate-vocabulary)
  - [Reference-driven object existence](#reference-driven-object-existence)
  - [Stub objects](#stub-objects)
- [Minimum objects](#minimum-objects)

## Top-level files

The server reads only these package YAML files when present:

- `manifest.yaml`: Study-level manifest.
  Required.
- `paper.yaml`: Paper section structure and main claims/limitations pointers.
- `claims.yaml`: Major claims.
- `figures.yaml`: Figure and panel metadata.
- `datasets.yaml`: Dataset inventory and usage notes.
- `methods.yaml`: Method and preprocessing map.
- `codebase.yaml`: Virtual codebase map.
- `assumptions.yaml`: Assumptions, limitations, and caveats.
- `provenance.yaml`: Cross-object provenance links.
- `related-work.yaml`: Related work needed to understand methods or assumptions.
- `operations.yaml`: Descriptive operation recipes.

Only the YAML files listed here are package inputs for `scicon serve`.
Development directories such as mining, conversion, and validation are not read by `scicon serve`.

Example:

```text
scp-package/
|-- manifest.yaml
|-- paper.yaml
|-- claims.yaml
|-- figures.yaml
|-- datasets.yaml
|-- methods.yaml
|-- codebase.yaml
|-- assumptions.yaml
|-- provenance.yaml
|-- related-work.yaml
\-- operations.yaml
```

## Evidence statuses

Use evidence statuses on important objects and links:

- `explicit`: Directly stated in a source artifact.
- `extracted`: Produced by deterministic or rule-based extraction.
- `inferred`: Proposed by rules, an LLM, or agent reasoning.
- `imported`: Imported from existing machine-readable metadata.
- `author_confirmed`: Confirmed by an author or maintainer.
- `missing`: Expected information is absent.
- `ambiguous`: Multiple interpretations remain.
- `unresolved`: Known follow-up item.

Do not turn inferred or ambiguous metadata into confirmed metadata without source evidence or author confirmation.

## provenance.yaml typed edges

`provenance.yaml` is the canonical place for support, provenance, and other cross-object relationships.
Object files keep intrinsic fields; typed edges carry the link graph.

Each edge should use this shape:

```yaml
edges:
  - id: edge_fig_2b_generated_by_build_figure2
    subject: fig_2b
    predicate: generated_by
    object: build_figure2
    evidence_status: explicit
    confidence: high
    source_artifacts:
      - inputs/artifacts/readme_fragment.md
    source_locations:
      - README fragment
    extraction_methods:
      - direct_quote
    author_confirmation_needed: false
```

Use these fields:

- `id`
- `subject`
- `predicate`
- `object`
- `evidence_status`
- `confidence`
- `source_artifacts`
- `source_locations`
- `extraction_methods`
- `author_confirmation_needed`

Notes:

- Edge `id` values use `edge_<subject>_<predicate>_<object>`.
- `subject` and `object` are object IDs, not file paths.
- `predicate` must come from the closed vocabulary below.
- `evidence_status` uses the same status set documented in [Evidence statuses](#evidence-statuses).
- `confidence` uses `high`, `medium`, or `low`.

### Predicate vocabulary

The package schema uses a closed predicate vocabulary.

- `supported_by` Allowed subjects: `claim`.
  Allowed objects: `figure`, `dataset`, `code_artifact`, `method`.
- `generated_by` Allowed subjects: `figure`.
  Allowed objects: `code_artifact`.
- `uses_dataset` Allowed subjects: `figure`.
  Allowed objects: `dataset`.
- `uses_method` Allowed subjects: `figure`, `claim`.
  Allowed objects: `method`.
- `has_assumption` Allowed subjects: `claim`, `figure`, `method`.
  Allowed objects: `assumption`.
- `references_result` Allowed subjects: `paper_section`.
  Allowed objects: `claim`, `figure`.
- `references_artifact` Allowed subjects: `study`, `operation`.
  Allowed objects: `dataset`, `code_artifact`, `figure`.
- `depends_on_related_work` Allowed subjects: `claim`, `method`.
  Allowed objects: `related_work`.

### Reference-driven object existence

An object exists in the package when at least one edge references it or an author has explicitly created it.
Otherwise the object does not need to be enumerated.
This keeps package authoring focused and avoids forcing authors to fully populate object files for entities that no current consumer asks about.

### Stub objects

A stub is a valid minimal object entry used when a relationship is known to exist but the referenced object is not yet documented.
A stub keeps `id` plus an unresolved status, and any remaining intrinsic fields may be omitted or set to `missing`.

Example:

```yaml
datasets:
  - id: dataset_behavior_windows
    name: missing
    evidence_status: unresolved
```

Use `evidence_status: unresolved`, `missing`, or `ambiguous` on stubs, depending on what is known.

## Minimum objects

The object model should stay small.
Add fields only when they help answer package-server queries.
Cross-object support and provenance relationships should be expressed through typed edges in `provenance.yaml`.

### Study

- `id`
- `title`
- `authors`
- `summary`
- `paper`
- `repository`
- `data_sources`
- `schema_version`
- `conversion_status`

Optional manifest fields include `supplementary_materials`, `software_environment`, `licenses`, `persistent_identifiers`, `maintainers`, `object_version`, `related_work`, and `packaging_status`.

### Paper section

- `id`
- `title`
- `type`
- `source_location`
- `related_claims`
- `related_figures`
- `evidence_status`

`related_claims` and `related_figures` are intrinsic paper-map fields.
Other cross-object relationships should use typed edges.

### Claim

- `id`
- `text`
- `section`
- `evidence_status`

Use `section` as a reference to a `paper.yaml` section `id` when paper structure is represented.
Mark it `missing` or `ambiguous` when the section cannot be resolved.

### Figure

- `id`
- `caption`
- `panels`
- `reproduction_status`
- `evidence_status`

### Dataset

- `id`
- `name`
- `description`
- `type`
- `location`
- `download_instructions`
- `usage_notes`
- `variables`
- `evidence_status`

`variables` is optional and holds variable-level descriptions when the package needs them.

### Code artifact

- `id`
- `path`
- `purpose`
- `inputs`
- `outputs`
- `role`
- `status`
- `execution_instructions`
- `evidence_status`

### Method step

- `id`
- `description`
- `inputs`
- `outputs`
- `parameters`
- `script`
- `quality_checks`
- `evidence_status`

### Assumption

- `id`
- `description`
- `severity`
- `evidence_status`

### Related work

- `id`
- `citation`
- `identifier`
- `relationship`
- `differences`
- `evidence_status`

### Operation recipe

- `id`
- `name`
- `purpose`
- `inputs`
- `outputs`
- `steps`
- `commands`
- `safety_level`
- `known_caveats`
- `execution_supported`

Use `execution_supported` to describe the recipe metadata.
The field does not grant execution authority by itself.
See [README.md](../README.md#current-status) for current implementation support and [docs/protocol.md](protocol.md#final-protocol-stages) for final-product context.
