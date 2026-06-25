# SCP protocol context

This document describes the high-level final SCP protocol context.

When this document and the current status differ, follow [README.md](../README.md#current-status) unless the user explicitly asks to expand scope.

<!-- toc -->

- [Protocol goal](#protocol-goal)
- [Final protocol stages](#final-protocol-stages)
- [Current status](#current-status)
- [Evidence rule](#evidence-rule)
- [Agent answer rule](#agent-answer-rule)
- [Controlled operation rule](#controlled-operation-rule)

## Protocol goal

The final SCP protocol should turn a scientific output into a validated, queryable research object that agents can use to help experts understand, verify, and reuse scientific work.

The protocol does not prove that a study is correct.
It exposes the study's materials, provenance, assumptions, and operational context for grounded inspection.

## Final protocol stages

The full protocol may include:

1. Artifact mining over paper, supplement, code, data, figures, docs, and related work.
2. Conversion and normalization into package files.
3. Author confirmation for high-impact inferred links.
4. Validation of schema, links, evidence statuses, and grounded interface behavior.
5. A read-only inspection layer through a CLI, API, MCP server, or other interface.
6. Controlled operations after that inspection layer is trustworthy and only with explicit approval.

## Current status

[README.md](../README.md#current-status) records which protocol stages this repository currently implements and omits.
Protocol stages that are not covered there are final-product context, not implementation scope.

## Evidence rule

Package content should distinguish:

- `explicit`
- `extracted`
- `inferred`
- `imported`
- `author_confirmed`
- `missing`
- `ambiguous`
- `unresolved`

Mined or inferred evidence is not confirmed package truth unless source evidence or author confirmation supports it.

## Agent answer rule

Agent-facing answers should cite package artifacts and state when information is missing, ambiguous, or inferred.

The correct fallback is "not enough information," not plausible unsupported provenance.

## Controlled operation rule

Controlled operations are a final-product feature that comes after the read-only inspection layer is trustworthy.
Operation recipes may list intended commands or inputs if those are declared by the package, but they must not imply execution authority until controlled operations are implemented and explicitly approved.
