# Project overview

This project (`scicon`) is the official implementation of the [Scientific Context Protocol (SCP)](protocol.md).
It serves a hand-authored, structured representation of a scientific output to AI agents over [MCP](https://modelcontextprotocol.io).
Ahead of time, the authors encode the study's claims, figures, data, methods, assumptions, and provenance into an SCP package, and each package object and link carries an [evidence status](protocol.md#evidence).
`scicon` then serves that package read-only to connected agents.

That arrangement lets an agent answer questions from confirmed structure instead of reconstructing everything from raw papers, notebooks, and data at question time.
Question-time reconstruction is what invites hallucination and obscures the evidence behind each statement.
By serving the package directly, `scicon` keeps answers grounded and able to cite their source.

This project is currently an MVP.
It implements a working core of the protocol rather than the whole of it, so some stages are still simplified or not yet built.
See [current status](../README.md#current-status) for the authoritative scope, and the [stages below](#protocol-stages-in-this-mvp) for how the current tool maps onto the protocol.

## Pipeline

```text
source artifacts  --(author)-->  scp-package/  --(serve over MCP)-->  agent  -->  grounded, cited answer
```

In the current MVP:

1. The authors produce a scientific output (paper, code, data, figures, etc.) and publish a repository with those artifacts.
2. The authors encode the relevant context into `scp-package/`, the [structured YAML package](package-schema.md) that `scicon` serves.
3. The authors run [`scicon validate`](validation.md) to check that the package is structurally valid before serving it to agents.
4. The user clones the repository, installs `scicon`, and runs [`scicon init`](init.md) to register the MCP server with supported agent tooling.
5. The user runs `scicon serve` to expose `scp-package/` through a [read-only MCP interface](mcp-server.md).
6. The user asks a question through an agent connected to that MCP server.
7. The agent reads package content from the MCP interface instead of inferring everything from raw study files at question time.
8. The agent returns a grounded answer tied to structured package content and its recorded evidence statuses, [as the protocol requires](protocol.md#agent-facing-answers).

## Participants

- **The authors** produce the study and its source artifacts, and encode them into the SCP package.
- **The user** installs `scicon`, runs the MCP server, and asks questions through an agent.
- **The agent** is the MCP client that reads package content and returns grounded answers.

## Protocol stages in this MVP

The protocol defines six [protocol stages](protocol.md#protocol-stages), and this MVP implements only part of that arc.
The mapping below places each stage in context.

| Protocol stage | In this MVP |
| --- | --- |
| Mining and conversion (1, 2) | Mocked, so the authors write the package by hand instead of deriving it from source artifacts. |
| Author confirmation (3) | Manual, as the authors record the evidence status of each package object and link. |
| Validation (4) | `scicon validate`. |
| Read-only inspection (5) | `scicon serve` over MCP. |
| Controlled operations (6) | Out of scope; the interface does not execute commands, download data, or modify files. |
