"""
Tests for scp logging configuration and server log output.
"""

import logging
from pathlib import Path
import sys

import pytest

from scicon.cli import main as cli_main
from scicon.interface.server import build_mcp_server


@pytest.fixture
def isolated_scp_logger() -> None:
    """Snapshot and restore the 'scp' logger so tests do not leak state."""
    scp_logger = logging.getLogger('scp')
    saved_handlers = scp_logger.handlers[:]
    saved_level = scp_logger.level
    saved_propagate = scp_logger.propagate
    scp_logger.handlers.clear()
    scp_logger.setLevel(logging.NOTSET)
    scp_logger.propagate = True
    try:
        yield
    finally:
        scp_logger.handlers[:] = saved_handlers
        scp_logger.setLevel(saved_level)
        scp_logger.propagate = saved_propagate


class TestConfigureLogging:
    """Tests for _configure_logging."""

    def test_adds_single_stderr_handler_and_is_idempotent(
        self,
        isolated_scp_logger: None,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.delenv('SCP_LOG_LEVEL', raising=False)
        cli_main._configure_logging()
        cli_main._configure_logging()
        scp_logger = logging.getLogger('scp')
        assert len(scp_logger.handlers) == 1
        handler = scp_logger.handlers[0]
        assert isinstance(handler, logging.StreamHandler)
        assert handler.stream is sys.stderr
        assert scp_logger.level == logging.INFO
        assert scp_logger.propagate is False

    def test_level_read_from_environment(
        self,
        isolated_scp_logger: None,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv('SCP_LOG_LEVEL', 'debug')
        cli_main._configure_logging()
        assert logging.getLogger('scp').level == logging.DEBUG

    def test_unknown_level_falls_back_to_info(
        self,
        isolated_scp_logger: None,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv('SCP_LOG_LEVEL', 'not-a-level')
        cli_main._configure_logging()
        assert logging.getLogger('scp').level == logging.INFO


class TestServerLogging:
    """Tests for build_mcp_server log output."""

    def test_logs_package_load_summary(
        self,
        example_package_path: Path,
        isolated_scp_logger: None,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        with caplog.at_level(logging.INFO, logger='scp'):
            build_mcp_server(example_package_path)
        text = '\n'.join(record.getMessage() for record in caplog.records)
        assert 'Loaded SCP package' in text
