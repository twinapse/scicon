# MCP server

This document explains how to install and run the MCP server this repository provides.

<!-- toc -->

- [Install](#install)
- [Path resolution](#path-resolution)
- [Manual registration](#manual-registration)
- [Tools](#tools)
- [Resources](#resources)
- [Serving behavior](#serving-behavior)

## Install

Install from this repository in a Python 3.12 environment:

```bash
pip install -e .
```

Validate a package:

```bash
scicon validate --package-dir examples/scp-package
```

Run the server over stdio:

```bash
scicon serve --package-dir examples/scp-package
```

## Path resolution

`scicon serve` and `scicon validate` resolve the package directory in this order:

1. `--package-dir`.
2. `SCP_PACKAGE_DIR`.
3. `./scp-package` relative to the current working directory.

The resolved package root must contain `manifest.yaml`.
Package-relative file opens are guarded so paths cannot escape the package root.

## Logging

`scicon serve` and `scicon validate` write logs to `stderr`, never to `stdout`, so server logs never interfere with the `stdio` MCP protocol stream.
Set the `SCP_LOG_LEVEL` environment variable to control verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`; default `INFO`).
On startup the server logs the resolved package directory and a summary of the loaded package; a validation failure is logged at `ERROR` before the process exits non-zero.

## Manual registration

For managed target-repo setup, use [`scicon init`](init.md).
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

- `get_study_summary`
- `list_claims`
- `trace_claim_to_evidence`
- `get_figure_provenance`
- `get_dataset_description`
- `get_preprocessing_chain`
- `explain_code_file`
- `list_assumptions`
- `find_related_objects`

Each tool returns a structured result with a status, package objects, evidence statuses, and citations.
Unknown IDs or absent links return `not_enough_information` instead of raising an agent-facing exception.

## Resources

- `paper://sections`
- `paper://claims`
- `figures://{figure_id}`
- `datasets://inventory`
- `codebase://map`
- `provenance://{object_id}`

## Serving behavior

See [README.md](../README.md#current-status) for implemented server behavior.
Tool responses preserve package evidence statuses and return `not_enough_information` when package content cannot support an answer.
