# MCP server

This document defines the MCP server interface and explains how to run and configure it.

<!-- toc -->

- [Path resolution](#path-resolution)
- [Logging](#logging)
- [Manual registration](#manual-registration)
- [Tools](#tools)
- [Resources](#resources)
- [Serving behavior](#serving-behavior)

## Path resolution

`scicon serve` resolves the package directory in this order:

1. `--package-dir`.
2. `SCP_PACKAGE_DIR`.
3. `./scp-package` relative to the current working directory.

The resolved package root must contain `manifest.yaml`.
Package-relative file opens are guarded so paths cannot escape the package root.

## Logging

`scicon serve` writes logs to `stderr`, never to `stdout`, so server logs never interfere with the `stdio` MCP protocol stream.
Set the `SCP_LOG_LEVEL` environment variable to control verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`; default `INFO`).
On startup the server logs the resolved package directory and a summary of the loaded package; a validation failure is logged at `ERROR` before the process exits non-zero.

## Manual registration

For managed setup, use [`scicon init`](init.md).
This section records the low-level MCP server registration contract for launchers or integrations that need to be configured by hand.

Use `SCP_PACKAGE_DIR` plus `serve --package-dir` because launcher working directories can differ.

For clients that read `.mcp.json`, use this JSON shape:

```json
{
  "mcpServers": {
    "scp": {
      "command": "/path/to/python-env/bin/scicon",
      "args": ["serve", "--package-dir", "${workspaceFolder}/scp-package"],
      "env": {
        "SCP_PACKAGE_DIR": "${workspaceFolder}/scp-package"
      }
    }
  }
}
```

For Codex, use this TOML shape in `~/.codex/config.toml` or a trusted project-local `.codex/config.toml`:

```toml
[mcp_servers.scp]
command = "/path/to/python-env/bin/scicon"
args = ["serve", "--package-dir", "${workspaceFolder}/scp-package"]

[mcp_servers.scp.env]
SCP_PACKAGE_DIR = "${workspaceFolder}/scp-package"
```

## Tools

Each tool returns a structured result with a status, package objects, evidence statuses, and citations.
Unknown IDs or absent links return `not_enough_information` instead of raising an agent-facing exception, implementing the protocol's [Agent-facing answers requirements](protocol.md#agent-facing-answers).

| Name | Input shape | Output object(s) | Status behavior | Missing-info behavior | Citations |
| --- | --- | --- | --- | --- | --- |
| `get_study_summary` | Optional study ID | Study manifest | Returns stored manifest statuses | Unknown study returns `not_enough_information` | `manifest.yaml` |
| `list_claims` | Optional section or evidence status | Claim objects | Returns claim statuses unchanged | Empty filters return `not_enough_information` | `claims.yaml`, `paper.yaml` |
| `trace_claim_to_evidence` | Claim ID | Claim plus linked evidence objects | Returns object and edge statuses unchanged | Unknown claim or absent links return `not_enough_information` | `claims.yaml`, `provenance.yaml`, source artifacts |
| `get_figure_provenance` | Figure ID | Figure plus linked data, code, and methods | Returns provenance and reproduction statuses | Unknown figure or absent links return `not_enough_information` | `figures.yaml`, `provenance.yaml`, source artifacts |
| `get_dataset_description` | Dataset ID | Dataset object | Returns dataset statuses and usage notes | Unknown dataset returns `not_enough_information` | `datasets.yaml` |
| `get_preprocessing_chain` | Method, claim, or figure ID | Method-step objects | Returns method statuses unchanged | Unknown object or absent method links return `not_enough_information` | `methods.yaml`, `provenance.yaml` |
| `explain_code_file` | Code ID or path | Code artifact object | Returns codebase status fields unchanged | Unknown code artifact returns `not_enough_information` | `codebase.yaml` |
| `list_assumptions` | Optional object ID or severity | Assumption objects | Returns assumption statuses unchanged | Empty filters return `not_enough_information` | `assumptions.yaml`, `provenance.yaml` |
| `find_related_objects` | Object ID and optional predicate | Neighboring objects and edges | Returns link statuses unchanged | Unknown object or absent links return `not_enough_information` | `provenance.yaml`, source artifacts |

## Resources

Resources expose read-only, URI-addressable views of package content through MCP `resources/list`, `resources/templates/list`, and `resources/read`.
Static URIs return paper or package inventories, and template URIs expand object-specific views on demand.

- `paper://sections`
- `paper://claims`
- `figures://{figure_id}`
- `datasets://inventory`
- `codebase://map`
- `provenance://{object_id}`

## Serving behavior

See the architecture guide's [Serving model](architecture.md#serving-model) for the server startup sequence.
See [README.md](../README.md#current-status) for implemented server behavior.
