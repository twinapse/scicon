# Target-repo bootstrap

`scicon init` bootstraps a consuming research repository so coding agents prefer the SCP MCP server before reading raw papers, code, notebooks, or data files.
It is separate from `scicon serve`: the server reads and serves the package, while `scicon init` writes a small, managed set of files into the target repo selected on the command line.

<!-- toc -->

- [Quick start](#quick-start)
- [Generated artifacts](#generated-artifacts)
- [Agent targeting](#agent-targeting)
- [Always-on policy modes](#always-on-policy-modes)
- [Managed merge behavior](#managed-merge-behavior)
- [Refresh and uninstall](#refresh-and-uninstall)
- [Template source of truth](#template-source-of-truth)

## Quick start

From a target repository that will contain a hand-authored `scp-package/` directory:

```bash
scicon init .
```

The command registers the MCP server with the relative `scp-package` path.
The package directory does not need to exist yet; `scicon init` warns and still writes the registration so authors can add package YAML later.

Use `--dry-run` to inspect intended changes without writing files:

```bash
scicon init . --dry-run
```

## Generated artifacts

By default, `scicon init` writes these target-repo artifacts:

- `.mcp.json`: Adds or replaces only `mcpServers.scp`.
- `.codex/config.toml`: Adds or replaces only `[mcp_servers.scp]`.
- `.claude/skills/scp/SKILL.md`: Claude Code on-demand skill.
- `.agents/skills/scp/SKILL.md`: Codex on-demand skill.
- `.github/prompts/scp.prompt.md`: GitHub Copilot prompt file.
- `.github/copilot-instructions.md`: Always-on policy block in the default `auto` mode.

The MCP registration entries use the contracts documented in [docs/mcp-server.md](mcp-server.md), with the command rendered as an absolute, machine-specific path and the package directory rendered as relative `scp-package`.
Run `scicon init . --refresh` on each machine after installing or upgrading `scicon` so the registration points at that machine's Python environment.

Pass `--no-skill` to skip skill and prompt files, or `--no-mcp` to skip MCP server registration files.

## Agent targeting

Use repeated `--agent` flags to write only selected integrations.
The accepted values are `claude-code`, `codex`, `copilot`, and `all`.

| Agent | MCP registration file | Always-on policy file | On-demand surface | `auto` writes policy |
| --- | --- | --- | --- | --- |
| Claude Code | `.mcp.json` | `AGENTS.md` | `.claude/skills/scp/SKILL.md` | No |
| Codex | `.codex/config.toml` | `AGENTS.md` | `.agents/skills/scp/SKILL.md` | No |
| GitHub Copilot | `.mcp.json` | `.github/copilot-instructions.md` | `.github/prompts/scp.prompt.md` | Yes |

Claude Code and Codex get the routing hint from skill metadata, so `auto` avoids duplicating prose in `AGENTS.md`.
Copilot prompt files are user-invoked, so `auto` writes the always-on policy to Copilot instructions.
Codex loads project-local `.codex/config.toml` only for trusted projects and prompts for trust on first use, which is analogous to approving `.mcp.json` in clients that read that file.

## Always-on policy modes

`--always-on` controls only the prose policy block.
It does not affect MCP registration or skill/prompt creation.

| Mode | Behavior |
| --- | --- |
| `auto` | Writes policy only where the selected agent needs it. This is the default. |
| `all` | Writes policy into every selected agent's always-on instructions file. |
| `none` | Writes no prose policy block. Skills/prompts and MCP registration files are still produced unless suppressed. |

## Managed merge behavior

Markdown policy text is wrapped in HTML comment markers:

```markdown
<!-- SCP START -->
...
<!-- SCP END -->
```

On rerun, `scicon init` replaces only the marked region.
User content outside the markers is preserved.
Missing files are created as needed.

For `.mcp.json`, the command preserves all top-level keys and all other MCP servers.
It sets or replaces only the `scp` server key.
A malformed existing `.mcp.json` fails with a clear error instead of being overwritten.
For `.codex/config.toml`, the command preserves user comments, top-level keys, and other tables.
It sets or replaces only `[mcp_servers.scp]`.
A malformed existing `.codex/config.toml` fails with a clear error instead of being overwritten.

Skill and prompt files are owned by `scicon init` and are written from the packaged templates for each selected agent.
Policy files created by `scicon init` are deleted on uninstall when no user content remains after the managed block is removed.

## Refresh and uninstall

Use `--refresh` after upgrading `scicon` to re-emit the current canonical templates:

```bash
scicon init . --refresh
```

Use `--uninstall` to remove managed SCP regions, selected MCP server registration entries, and the init-owned skill and prompt files:

```bash
scicon init . --uninstall
```

Uninstall preserves user content outside managed markers and preserves foreign MCP server registrations and Codex config tables.

## Template source of truth

The policy, skill/prompt front matter, shared skill body, and routing table are packaged under `scicon/init/templates/` and rendered at install time.
The fallback status string comes from the live interface constant, so the bootstrap text stays aligned with the MCP tool contract.
