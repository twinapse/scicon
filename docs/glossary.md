# Glossary

Short glossary for SCP packages and server behavior.

- **Assumption registry**: Assumptions, limitations, caveats, and typed links to the claims, figures, or methods they affect.
  See [Assumption](package-schema.md#assumption).

- **Claim graph**: Major claims and their typed provenance links to supporting figures, datasets, code, methods, assumptions, limitations, and related work.
  See [Claim](package-schema.md#claim) and [`provenance.yaml` typed edges](package-schema.md#provenanceyaml-typed-edges).

- **Codebase map**: A virtual classification of existing files by role, such as preprocessing, final analysis, figure generation, exploratory, utility, deprecated, or unknown.
  See [Code artifact](package-schema.md#code-artifact).

- **Dataset inventory**: Structured descriptions of data used by the packaged study, including variable-level descriptions when available.
  See [Dataset](package-schema.md#dataset).

- **Deployment mode**: Whether a feature runs with no model, a local model, a third-party model API, or human confirmation.
  See [Dependency transparency](architecture.md#dependency-transparency).

- **Evidence status**: See the protocol's [Terminology](protocol.md#terminology) and [Evidence requirements](protocol.md#evidence).

- **Figure provenance**: Links from a figure or panel to source data, analysis code, outputs, methods, and reproducibility notes.
  See [Figure](package-schema.md#figure) and [`provenance.yaml` typed edges](package-schema.md#provenanceyaml-typed-edges).

- **Manifest**: The `manifest.yaml` file with study-level metadata and package status.
  See [Top-level files](package-schema.md#top-level-files) and [Study](package-schema.md#study).

- **MCP interface**: Tools and resources that let an agent inspect package content without modifying files, executing commands, or downloading data.
  See [Tools](mcp-server.md#tools) and [Resources](mcp-server.md#resources).

- **Method map**: Preprocessing, experimental, mathematical, statistical, or analysis steps with inputs, outputs, code, rationale, and caveats.
  See [Method step](package-schema.md#method-step).

- **Mined evidence**: See the protocol's [Terminology](protocol.md#terminology) and [Evidence requirements](protocol.md#evidence).

- **Operation recipe**: See the protocol's [Terminology](protocol.md#terminology) and [Controlled operations requirements](protocol.md#controlled-operations).

- **Paper structure map**: The `paper.yaml` representation of paper or supplement sections, their source locations, and intrinsic links to the claims and figures they contain.
  See [Paper section](package-schema.md#paper-section).

- **Related-work map**: Prior work that materially affects methods, assumptions, algorithms, or interpretation.
  See [Related work](package-schema.md#related-work).

- **Scientific output**: See the protocol's [Terminology](protocol.md#terminology).

- **SCP package**: See the protocol's [Terminology](protocol.md#terminology).
