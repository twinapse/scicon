"""
Tests for `scicon init` installer helpers.
"""

from pathlib import Path

from scicon.init import installer
from scicon.init.installer import SERVE_COMMAND


class TestServeCommandResolution:
    """Tests for resolving the `scicon` launcher command."""

    def test_resolve_serve_command_returns_installed_script(self) -> None:
        serve_command = installer._resolve_serve_command()

        command_path = Path(serve_command)
        assert command_path.is_absolute()
        assert command_path.name == SERVE_COMMAND
