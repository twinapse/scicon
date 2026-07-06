# SciCon

SciCon is the official implementation of the [Scientific Context Protocol (SCP)](docs/protocol.md), which defines an agent-readable layer for grounded inspection of scientific outputs.

With the installable `scicon` Python package, you can add a hand-authored `scp-package/` directory to a scientific repository, validate that structured package, and serve it to AI agents over MCP.
That gives connected agents a grounded, evidence-aware view of the study's claims, data, methods, and provenance.

<!-- toc -->

- [Current status](#current-status)
- [Install and run](#install-and-run)
- [Example package](#example-package)
- [Documentation](#documentation)

## Current status

This repository is currently in its MVP phase.
This section is the source of truth for the repository's current features and limitations.

### Features

- Package schema objects and closed evidence/predicate vocabularies.
- Path resolution for `--package-dir`, `SCP_PACKAGE_DIR`, and `./scp-package`.
- A typed YAML loader for hand-authored package files.
- Validation for IDs, statuses, links, predicate legality, section references, and uncertainty.
- Pure query functions for claims, figures, datasets, methods, code, assumptions, related objects, and resources.
- A thin FastMCP adapter and CLI subcommands: `scicon init`, `scicon serve`, and `scicon validate`.

### Limitations

- Mining and conversion are mocked, so humans author the package directly.
- At serve time, the server reads package YAML, not raw papers, notebooks, datasets, or repository files.
- The repository does not implement automatic artifact mining or general conversion for arbitrary repositories.
- Controlled operations remain final-product scope: the current MCP interface does not execute commands, download data, or modify files.

## Install and run

Install `scicon` in a Python 3.12 environment:

```bash
pip install scicon
```

In your repository, create a hand-authored `scp-package/` directory and register `scicon`:

```bash
scicon init .
```

`scicon init` writes MCP registration files plus agent instructions, skills, and prompts that tell supported coding agents to query the `scp` MCP tools first.
The command is idempotent and preserves user content outside its managed markers.
It registers `scicon serve` with the relative `scp-package` path.
See [docs/init.md](docs/init.md) for generated files and [docs/mcp-server.md](docs/mcp-server.md) for manual MCP registration and path resolution.

Validate the package:

```bash
scicon validate --package-dir scp-package
```

Run the MCP server over stdio:

```bash
scicon serve --package-dir scp-package
```

## Example package

[`examples/scp-package`](examples/scp-package) is the template and fixture shipped with this repository.
It contains one small neuroscience-style package with claims, figures, datasets, methods, code artifacts, assumptions, related work, operation recipes, and typed provenance edges.

## Documentation

### Start here

- [docs/protocol.md](docs/protocol.md): SCP protocol specification and source of truth for protocol-specific terminology and definitions.
- [docs/overview.md](docs/overview.md): Project and tool orientation, usage pipeline, and participant roles.
- [docs/glossary.md](docs/glossary.md): Alphabetical term reference.

### Author and validate SCP packages

- [docs/package-schema.md](docs/package-schema.md): Package files, object shapes, evidence-status encoding, and predicate vocabulary.
- [docs/validation.md](docs/validation.md): Validation checks and report behavior.

### Bootstrap and serve SCP packages

- [docs/init.md](docs/init.md): Repository bootstrap, managed files, agent targeting, and refresh/uninstall behavior.
- [docs/mcp-server.md](docs/mcp-server.md): MCP registration, path resolution, tools, resources, and serving behavior.

### Contribute

- [CONTRIBUTING.md](CONTRIBUTING.md): Shared contributor policies, checks, and Git conventions.
- [docs/architecture.md](docs/architecture.md): Package layout, layer boundaries, serving model, and dependency modes.
- [docs/releasing.md](docs/releasing.md): Release automation, versioning, changelog, and PyPI sequencing.
- [docs/coding-agent-setup.md](docs/coding-agent-setup.md): Project-local coding-agent setup guidance.
