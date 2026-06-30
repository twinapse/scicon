# Project overview

This document describes the overall SCP vision, conceptual pipeline, and trust model.

<!-- toc -->

- [SCP vision](#scp-vision)
- [Pipeline](#pipeline)
- [Trust model](#trust-model)

## SCP vision

Scientific Context Protocol (SCP) is the idea that a scientific output should ship with an agent-readable layer, not only a paper PDF and a repository.

The final product should help expert users inspect a study's claims, figures, data, code, methods, assumptions, provenance, and relevant related work through a structured package and staged agent interface.

That final product may eventually include:

- A reusable package schema for scientific outputs.
- Artifact mining over papers, supplements, code, data, figures, and docs.
- Conversion tooling that normalizes mined evidence into package files.
- Author-confirmation workflows for high-impact inferred fields.
- Validation for package completeness, links, evidence statuses, and grounded agent behavior.
- A read-only inspection layer through MCP-compatible tools and resources.
- Domain-specific profiles after the first demonstrator proves value.
- Controlled operations only after the read-only inspection layer works and only with explicit user approval.

This repository is still in an **MVP** stage rather than the full product shape described above.
[README.md](../README.md#current-status) records the current implementation status and limitations.
Those final-product ideas are context.
They are not all implementation commitments for this repository.

## Pipeline

In the current MVP:

1. The authors produce a scientific output (paper, code, data, figures, etc.) and publish a repository with those artifacts.
2. The authors encode the relevant context into `scp-package/`, the structured YAML package that `scicon` serves.
3. The authors run `scicon validate` to check that the package is structurally valid before serving it to agents.
4. The user clones the repository, installs `scicon`, and runs `scicon init` to register the MCP server with supported agent tooling.
5. The user runs `scicon serve` to expose `scp-package/` through a read-only MCP interface.
6. The user asks a question through an agent connected to that MCP server.
7. The agent reads package content from the MCP interface instead of inferring everything from raw study files at question time.
8. The agent returns a grounded answer tied to structured package content and its recorded evidence statuses.

In this flow:

- **The authors** are the people who produced the study and its source artifacts.
- **The user** is the person who installs `scicon`, runs the MCP server, and asks questions through an agent.
- **The agent** is the MCP client that reads package content and returns grounded answers.

## Trust model

The server must distinguish:

- Information directly stated in source artifacts.
- Deterministically extracted metadata.
- Inferred metadata.
- Author-confirmed metadata.
- Missing information.
- Ambiguous or conflicting evidence.

The server should preserve those statuses exactly and prefer "not enough information" over plausible but unsupported provenance.
