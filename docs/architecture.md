# Architecture guide

This guide records the package layout, layer boundaries, serving model, dependency transparency, and interface boundaries.
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
- Keep mined evidence separate from confirmed package content according to the protocol's [Evidence requirements](protocol.md#evidence).
- Preserve source artifacts and source locations where package authors provide them.
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
- MCP server code should only adapt loaded package queries to FastMCP.

## Serving model

[MCP server path resolution](mcp-server.md#path-resolution) defines how `scicon serve` selects and guards the package root.

Server startup does this once:

1. Resolve the package root.
2. Validate package files.
3. Fail fast if any validation message has `error` severity.
4. Load package YAML into frozen dataclasses and indexes.
5. Register the FastMCP tools and resources over stdio.

See [Validation](validation.md) for the checks and report behavior.
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

The interface boundary returns package objects and evidence statuses rather than only prose summaries.
The [Tools](mcp-server.md#tools) and [Resources](mcp-server.md#resources) sections define the server inventory and concrete behavior.
Agent-facing behavior follows the protocol's [Agent-facing answers requirements](protocol.md#agent-facing-answers).
