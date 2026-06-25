# Core concepts

Short glossary for SCP packages and server behavior.

- **Scientific output**: The paper, supplement, code, data, figures, methods, assumptions, documentation, and related work needed to understand one study.

- **SCP package**: The structured YAML package that exposes a study as agent-readable context.
  SCP always expands to Scientific Context Protocol, so "SCP package" means a package produced under the protocol, not a second expansion of SCP.

- **Manifest**: The `manifest.yaml` file with study-level metadata and package status.

- **Paper structure map**: The `paper.yaml` representation of paper or supplement sections, their source locations, and intrinsic links to the claims and figures they contain.

- **Evidence status**: A marker showing whether a field or link is explicit, extracted, inferred, imported, author-confirmed, missing, ambiguous, or unresolved.

- **Mined evidence**: Candidate metadata or links extracted from source artifacts.
  Mined evidence is not automatically confirmed truth unless source evidence or author confirmation supports it.

- **Claim graph**: Major claims and their typed provenance links to supporting figures, datasets, code, methods, assumptions, limitations, and related work.

- **Figure provenance**: Links from a figure or panel to source data, analysis code, outputs, methods, and reproducibility notes.

- **Dataset inventory**: Structured descriptions of data used by the packaged study, including variable-level descriptions when available.

- **Method map**: Preprocessing, experimental, mathematical, statistical, or analysis steps with inputs, outputs, code, rationale, and caveats.

- **Codebase map**: A virtual classification of existing files by role, such as preprocessing, final analysis, figure generation, exploratory, utility, deprecated, or unknown.

- **Assumption registry**: Assumptions, limitations, caveats, and typed links to the claims, figures, or methods they affect.

- **Related-work map**: Prior work that materially affects methods, assumptions, algorithms, or interpretation.

- **Operation recipe**: Descriptive, human-reviewable instructions for a common task.
  See [docs/protocol.md](protocol.md#final-protocol-stages) for how controlled operations fit into the final product.

- **Deployment mode**: Whether a feature runs with no model, a local model, a third-party model API, or human confirmation.

- **MCP interface**: Tools and resources that let an agent inspect package content without modifying files, executing commands, or downloading data.
