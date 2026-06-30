# Scientific Context Protocol

The Scientific Context Protocol (SCP) defines an agent-readable layer published alongside a scientific output's paper PDF and repository.
SCP exposes a study's claims, figures, data, code, methods, assumptions, provenance, and related work through a structured package and a staged agent interface.

This repository is the official implementation of SCP.
The installable `scicon` Python package serves hand-authored SCP packages through an MCP interface.
Your repository installs `scicon`, authors a structured `scp-package/` directory, and exposes that package to AI agents through `scicon serve`.
The server validates structured package files and serves grounded answers through MCP.

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

- [docs/overview.md](docs/overview.md): Vision, conceptual pipeline, final-product context, and trust model.
- [docs/concepts.md](docs/concepts.md): Short glossary.

### Author and validate SCP packages

- [docs/package-schema.md](docs/package-schema.md): Package files, objects, statuses, and predicate vocabulary.
- [docs/validation.md](docs/validation.md): Validation checks and report behavior.

### Bootstrap and serve SCP packages

- [docs/init.md](docs/init.md): Repository bootstrap, managed files, agent targeting, and refresh/uninstall behavior.
- [docs/mcp-server.md](docs/mcp-server.md): MCP registration, tools, resources, and path resolution.

### Contribute

- [CONTRIBUTING.md](CONTRIBUTING.md): Shared contributor policies, checks, and Git conventions.
- [docs/architecture.md](docs/architecture.md): Package layout, layer boundaries, serving model, and interface contract.
- [docs/protocol.md](docs/protocol.md): Final-protocol context and expansion rules.
- [docs/releasing.md](docs/releasing.md): Release automation, versioning, changelog, and PyPI sequencing.
- [docs/coding-agent-setup.md](docs/coding-agent-setup.md): Project-local coding-agent setup guidance.
