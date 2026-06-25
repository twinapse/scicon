# Project overview

This document describes the overall SCP vision and trust model.

<!-- toc -->

- [SCP vision](#scp-vision)
- [Final product shape](#final-product-shape)
- [Current status](#current-status)
- [Trust model](#trust-model)

## SCP vision

Scientific Context Protocol (SCP) is the idea that a scientific output should ship with an agent-readable layer, not only a paper PDF and a repository.

The final product should help expert users inspect a study's claims, figures, data, code, methods, assumptions, provenance, and relevant related work through a structured package and staged agent interface.

The strongest framing is:

> From machine-readable science to agent-readable science.

## Final product shape

The final SCP product may eventually include:

- A reusable package schema for scientific outputs.
- Artifact mining over papers, supplements, code, data, figures, and docs.
- Conversion tooling that normalizes mined evidence into package files.
- Author-confirmation workflows for high-impact inferred fields.
- Validation for package completeness, links, evidence statuses, and grounded agent behavior.
- A read-only inspection layer through MCP-compatible tools and resources.
- Domain-specific profiles after the first demonstrator proves value.
- Controlled operations only after the read-only inspection layer works and only with explicit user approval.

Those final-product ideas are context.
They are not all implementation commitments for this repository.

## Current status

[README.md](../README.md#current-status) records the repository status.
This overview keeps the broader product framing separate from that implementation snapshot.

## Trust model

The server must distinguish:

- Information directly stated in source artifacts.
- Deterministically extracted metadata.
- Inferred metadata.
- Author-confirmed metadata.
- Missing information.
- Ambiguous or conflicting evidence.

The server should preserve those statuses exactly and prefer "not enough information" over plausible but unsupported provenance.
