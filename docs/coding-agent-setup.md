# Coding agent setup

This repository includes optional project-local setup for the coding agents we use in development: Codex and Claude Code.

<!-- toc -->

- [Setup checklist](#setup-checklist)
- [Shared skills](#shared-skills)
- [Codex](#codex)
- [Claude Code](#claude-code)

## Setup checklist

- Create or identify the Python virtual environment you want the agents to use.
- Keep any shared repository skills under `.agents/skills`.
- For Codex, create your local, gitignored `.codex/config.toml` and configure it for your environment.
- For Claude Code, create your local, gitignored `.claude/settings.local.json` and keep your personal permissions and environment bootstrap logic there.

Platform notes:

- The Python-environment validation hooks recognize both POSIX-style virtual environments (`bin/python`) and Windows-style ones (`Scripts/python.exe`).
- The launcher commands and examples in this document use POSIX shell conventions such as `python3`, `source`, `/bin`, and `:`-separated `PATH` values.
- The out-of-the-box setup is aimed at Linux, macOS, and WSL.
  Native Windows shells can use the same workflow with equivalent local command and path adjustments.

## Shared skills

Shared coding-agent skills, when present, should live under [`.agents/skills`](../.agents/skills).
There are no committed repository-specific skills required by the setup documented here.

Use that directory as the canonical location for committed, repository-specific skills:

- Add or update the real skill files in `.agents/skills`.
- Keep shared reference material in `docs/` and link to it from the skill instead of duplicating the same guidance.
- Prefer skills for agent-only workflow and guardrails.
  Prefer `docs/` for contributor-facing reference material.

Claude Code compatibility is provided through the symlink [`.claude/skills`](../.claude/skills), which points to `../.agents/skills`.

That means:

- New shared skills should be created under `.agents/skills`, not under `.claude/skills`.
- Claude Code sees the same committed skills through the symlinked path.
- If the symlink is ever missing or broken, recreate it so both agent setups resolve the same skill directory.

## Codex

The [`.codex`](../.codex) directory contains the Codex workflow for this repo:

- [`.codex/hooks.json`](../.codex/hooks.json) registers the project hooks.
- [`.codex/hooks/venv_session_start.py`](../.codex/hooks/venv_session_start.py) checks whether a valid Python virtual environment is configured and adds that information as session context.
- [`.codex/hooks/venv_user_prompt.py`](../.codex/hooks/venv_user_prompt.py) blocks work until the environment is configured.
  If needed, it can accept an absolute path to a virtual environment or Python executable and write a local `.codex/config.toml`.

Your local `.codex/config.toml` should stay uncommitted.
It enables Codex hooks and populates `shell_environment_policy` so subprocesses inherit the same `VIRTUAL_ENV` and `PATH` values as your project shell.
Because `PATH` is stored literally, prefer letting the hook generate this file for you.

Example `.codex/config.toml` with POSIX-style placeholders:

```toml
[features]
codex_hooks = true

[shell_environment_policy]
inherit = "all"
set = { VIRTUAL_ENV = "<ABSOLUTE_PATH_TO_VENV>", PATH = "<ABSOLUTE_PATH_TO_VENV>/bin:<EXISTING_PATH_ENTRIES>" }
```

On native Windows, keep `VIRTUAL_ENV` pointed at the environment root but switch the `PATH` entry to the environment's `Scripts` directory and use `;` as the path separator.

## Claude Code

The [`.claude`](../.claude) directory is reserved for Claude Code project settings.
In this repo, the relevant file is the local, gitignored `.claude/settings.local.json`.

That local file is the right place for personal, machine-specific Claude Code setup, for example:

- `permissions.allow` rules for repetitive local commands you want to pre-approve on your own machine.
- A `SessionStart` hook that prepares the same Python environment for later Bash commands via `CLAUDE_ENV_FILE`.

Keep those settings local and replace any path placeholders with values from your own machine.
If you later want to add shared Claude Code settings for the whole team, put those in `.claude/settings.json` instead of the local override file.

Example `.claude/settings.local.json` with POSIX-style placeholders:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "[ -n \"$CLAUDE_ENV_FILE\" ] && echo '. \"<VENV>/bin/activate\"' >> \"$CLAUDE_ENV_FILE\""
          }
        ]
      }
    ]
  }
}
```

This `command` example assumes a POSIX shell.
On native Windows, replace it with the equivalent local shell command for your environment manager and shell.
