# Architecture guide

This guide records the package layout, layer boundaries, serving model, and interface contract.
Keep the design small until the package-server workflow proves value.

<!-- toc -->

- [Principles](#principles)
- [Repository layout](#repository-layout)
- [Layer boundaries](#layer-boundaries)
- [Serving model](#serving-model)
- [Dependency transparency](#dependency-transparency)
- [Interface](#interface)

## Principles

- Build only what the package server needs.
- Keep mined evidence separate from confirmed package content.
- Preserve source artifacts and source locations where package authors provide them.
- Make evidence status explicit on important fields and links.
- Prefer deterministic parsing and validation before LLM-assisted inference.

## Repository layout

The implementation uses this layout:

```text
scicon/
|-- schema/      # statuses, predicates, filenames, objects, package container
|-- package/     # package directory resolution, traversal guard, YAML loader
|-- mining/      # reserved placeholder
|-- conversion/  # reserved placeholder
|-- validation/  # validation messages and structural checks
|-- interface/   # pure query functions and FastMCP adapter
\-- cli/         # `scicon init`, `scicon serve`, and `scicon validate` entry points

examples/scp-package/
tests/
docs/
```

Responsibilities:

- `scicon.schema`: Package filenames, object models, evidence statuses, confidence values, and predicate rules.
- `scicon.package`: Package path resolution and typed YAML loading.
- `scicon.mining`: Reserved placeholder module for future mining work.
- `scicon.conversion`: Reserved placeholder module for future conversion work.
- `scicon.validation`: Schema, link, status, predicate, section, and uncertainty checks.
- `scicon.interface`: Resources and tools for agent access.
- `scicon.cli`: Thin command-line entry points.

## Layer boundaries

- Schema code should not call LLMs or inspect the filesystem outside explicit package paths.
- Package loading should parse YAML into typed objects and should not perform interface formatting.
- Conversion placeholders should not imply automatic conversion support.
- Validation code should report gaps clearly rather than hiding incomplete package content.
- Interface code should return package objects and evidence statuses, not only prose summaries.
- MCP server code should only adapt loaded package queries to FastMCP.

## Serving model

`scicon serve` resolves a package directory in this order:

1. `--package-dir` CLI argument.
2. `SCP_PACKAGE_DIR` environment variable.
3. `./scp-package` relative to the launcher working directory.

The package root must contain `manifest.yaml`.
Every package-relative read is resolved and checked so traversal outside the package root is rejected.

Server startup does this once:

1. Resolve the package root.
2. Validate package files.
3. Fail fast if any validation message has `error` severity.
4. Load package YAML into frozen dataclasses and indexes.
5. Register the FastMCP tools and resources over stdio.

See [README.md](../README.md#current-status) for implemented server behavior.

## Dependency transparency

Each feature should disclose whether it needs no model, a local model, a third-party model API, or human confirmation.
Keep the deterministic-first rule: prefer parsing, imports, and validation before LLM-assisted inference.

| Stage | No-LLM deterministic | LLM optional | Human confirmation |
| --- | --- | --- | --- |
| Package authoring | Yes | Optional outside this repository | High-impact inferred links |
| YAML loading | Yes | No | No |
| Link and status validation | Yes | No | No |
| Package browsing | Yes | No | No |
| Interface serving | Yes | No | No |
| Natural-language answer drafting by a host agent | No | Yes | No |

[README.md](../README.md#current-status) lists which stages are implemented in this repository.
Any optional mining, conversion, or natural-language generation remains outside the deterministic server boundary unless that status changes there.

## Interface

The server exposes these tools:

- `get_study_summary`
- `list_claims`
- `trace_claim_to_evidence`
- `get_figure_provenance`
- `get_dataset_description`
- `get_preprocessing_chain`
- `explain_code_file`
- `list_assumptions`
- `find_related_objects`

It exposes these resources:

- `paper://sections`
- `paper://claims`
- `figures://{figure_id}`
- `datasets://inventory`
- `codebase://map`
- `provenance://{object_id}`

### Interface contract

Core interface entries follow this contract:

| Name | Input shape | Output object(s) | Status behavior | Missing-info behavior | Citations |
| --- | --- | --- | --- | --- | --- |
| `get_study_summary` | Optional study ID | Study manifest | Returns stored manifest statuses | Unknown study returns not enough information | `manifest.yaml` |
| `list_claims` | Optional section or evidence status | Claim objects | Returns claim statuses unchanged | Empty filters return not enough information | `claims.yaml`, `paper.yaml` |
| `trace_claim_to_evidence` | Claim ID | Claim plus linked evidence objects | Returns object and edge statuses unchanged | Unknown claim or absent links return not enough information | `claims.yaml`, `provenance.yaml`, source artifacts |
| `get_figure_provenance` | Figure ID | Figure plus linked data, code, and methods | Returns provenance and reproduction statuses | Unknown figure or absent links return not enough information | `figures.yaml`, `provenance.yaml`, source artifacts |
| `get_dataset_description` | Dataset ID | Dataset object | Returns dataset statuses and usage notes | Unknown dataset returns not enough information | `datasets.yaml` |
| `get_preprocessing_chain` | Method, claim, or figure ID | Method-step objects | Returns method statuses unchanged | Unknown object or absent method links return not enough information | `methods.yaml`, `provenance.yaml` |
| `explain_code_file` | Code ID or path | Code artifact object | Returns codebase status fields unchanged | Unknown code artifact returns not enough information | `codebase.yaml` |
| `list_assumptions` | Optional object ID or severity | Assumption objects | Returns assumption statuses unchanged | Empty filters return not enough information | `assumptions.yaml`, `provenance.yaml` |
| `find_related_objects` | Object ID and optional predicate | Neighboring objects and edges | Returns link statuses unchanged | Unknown object or absent links return not enough information | `provenance.yaml`, source artifacts |

Agent-facing answers should cite package artifacts and state when information is missing, ambiguous, or inferred.
