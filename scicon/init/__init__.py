"""
Bootstrap helpers for SCP agent integrations.
"""

from scicon.init.agents import AGENT_DESCRIPTORS
from scicon.init.agents import AGENT_KEYS
from scicon.init.agents import AgentDescriptor
from scicon.init.agents import ALL_AGENT_KEY
from scicon.init.agents import select_agents
from scicon.init.installer import AlwaysOnMode
from scicon.init.installer import install
from scicon.init.installer import InstallResult
from scicon.init.installer import refresh
from scicon.init.installer import uninstall
from scicon.init.merge import SCP_MARKER_BEGIN
from scicon.init.merge import SCP_MARKER_END

__all__ = [
    'AGENT_DESCRIPTORS',
    'AGENT_KEYS',
    'ALL_AGENT_KEY',
    'AgentDescriptor',
    'AlwaysOnMode',
    'InstallResult',
    'SCP_MARKER_BEGIN',
    'SCP_MARKER_END',
    'install',
    'refresh',
    'select_agents',
    'uninstall',
]
