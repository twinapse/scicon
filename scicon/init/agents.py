"""
Target agent descriptors for `scicon init`.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

__all__ = [
    'AGENT_DESCRIPTORS',
    'AGENT_KEYS',
    'ALL_AGENT_KEY',
    'AgentDescriptor',
    'select_agents',
]

ALL_AGENT_KEY = 'all'


@dataclass(frozen=True)
class AgentDescriptor:
    """
    Describe one target-repo agent integration.

    Args:
        key (str): CLI key for the agent.
        display_name (str): Human-readable agent name.
        policy_file (Path): Target-repo file for always-on policy text.
        skill_path (Path): Target-repo skill or prompt path.
        skill_template (str): Template filename for the skill or prompt.
        mcp_file (Path): Target-repo MCP registration file.
        mcp_format (Literal['json', 'toml']): MCP registration file format.
        needs_always_on_policy (bool): Whether ``--always-on auto`` writes
            policy text for this agent.
    """

    key: str
    display_name: str
    policy_file: Path
    skill_path: Path
    skill_template: str
    mcp_file: Path
    mcp_format: Literal['json', 'toml']
    needs_always_on_policy: bool


AGENT_DESCRIPTORS: tuple[AgentDescriptor, ...] = (
    AgentDescriptor(
        key='claude-code',
        display_name='Claude Code',
        policy_file=Path('AGENTS.md'),
        skill_path=Path('.claude/skills/scp/SKILL.md'),
        skill_template='skill.md',
        mcp_file=Path('.mcp.json'),
        mcp_format='json',
        needs_always_on_policy=False,
    ),
    AgentDescriptor(
        key='codex',
        display_name='Codex',
        policy_file=Path('AGENTS.md'),
        skill_path=Path('.agents/skills/scp/SKILL.md'),
        skill_template='skill.md',
        mcp_file=Path('.codex/config.toml'),
        mcp_format='toml',
        needs_always_on_policy=False,
    ),
    AgentDescriptor(
        key='copilot',
        display_name='GitHub Copilot',
        policy_file=Path('.github/copilot-instructions.md'),
        skill_path=Path('.github/prompts/scp.prompt.md'),
        skill_template='prompt.md',
        mcp_file=Path('.mcp.json'),
        mcp_format='json',
        needs_always_on_policy=True,
    ),
)
AGENT_KEYS = tuple(agent.key for agent in AGENT_DESCRIPTORS)


def select_agents(agent_keys: list[str] | None) -> tuple[AgentDescriptor, ...]:
    """
    Return descriptors for CLI-selected agents.

    Args:
        agent_keys (list[str] | None): Repeated ``--agent`` values. ``None`` or
            ``all`` selects every known agent.

    Returns:
        tuple[AgentDescriptor, ...]: Selected descriptors in canonical order.
    """
    if not agent_keys or ALL_AGENT_KEY in agent_keys:
        return AGENT_DESCRIPTORS
    requested = set(agent_keys)
    return tuple(agent for agent in AGENT_DESCRIPTORS if agent.key in requested)
