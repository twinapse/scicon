"""
Tests for the `scicon` CLI entry points.
"""

from pathlib import Path

import pytest

from scicon.cli import main as cli_main


class _FakeServer:
    """Stand-in MCP server that records whether run() was called."""

    def __init__(self) -> None:
        self.run_called = False

    def run(self) -> None:
        """Record that the stdio loop was entered."""
        self.run_called = True


class TestMain:
    """Tests for unified `scicon` subcommand dispatch."""

    def test_serve_subcommand_runs_server_and_returns_zero(
        self,
        example_package_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        fake_server = _FakeServer()
        monkeypatch.setattr(
            cli_main,
            'build_mcp_server',
            lambda package_dir: fake_server,
        )

        exit_code = cli_main.main([
            'serve',
            '--package-dir',
            str(example_package_path),
        ])

        assert exit_code == 0
        assert fake_server.run_called is True

    def test_validate_subcommand_returns_zero_and_prints_report(
        self,
        example_package_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        exit_code = cli_main.main([
            'validate',
            '--package-dir',
            str(example_package_path),
        ])

        assert exit_code == 0
        assert capsys.readouterr().out.strip()

    def test_init_subcommand_writes_expected_artifact(self, tmp_path: Path) -> None:
        exit_code = cli_main.main(['init', str(tmp_path)])

        assert exit_code == 0
        assert (tmp_path / '.mcp.json').is_file()

    def test_missing_subcommand_exits_nonzero(self) -> None:
        with pytest.raises(SystemExit) as error:
            cli_main.main([])

        assert error.value.code != 0


class TestValidateMain:
    """Tests for the `validate` command wrapper."""

    def test_valid_package_returns_zero_and_prints_report(
        self,
        example_package_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        exit_code = cli_main.validate_main(['--package-dir', str(example_package_path)])
        assert exit_code == 0
        assert capsys.readouterr().out.strip()

    def test_missing_directory_returns_one_and_reports_error(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        missing = tmp_path / 'absent_package'
        exit_code = cli_main.validate_main(['--package-dir', str(missing)])
        assert exit_code == 1
        assert 'not found' in capsys.readouterr().err


class TestServeMain:
    """Tests for the `serve` command wrapper."""

    def test_valid_package_runs_server_and_returns_zero(
        self,
        example_package_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        fake_server = _FakeServer()
        monkeypatch.setattr(
            cli_main,
            'build_mcp_server',
            lambda package_dir: fake_server,
        )
        exit_code = cli_main.serve_main(['--package-dir', str(example_package_path)])
        assert exit_code == 0
        assert fake_server.run_called is True

    def test_missing_directory_returns_one_without_traceback(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        missing = tmp_path / 'absent_package'
        exit_code = cli_main.serve_main(['--package-dir', str(missing)])
        captured = capsys.readouterr()
        assert exit_code == 1
        assert 'not found' in captured.err
        assert captured.out == ''

    def test_validation_failure_returns_one_and_reports_error(
        self,
        example_package_path: Path,
        monkeypatch: pytest.MonkeyPatch,
        capsys: pytest.CaptureFixture[str],
    ) -> None:

        def _raise(package_dir: object) -> object:
            raise RuntimeError('SCP package validation failed:\nboom')

        monkeypatch.setattr(cli_main, 'build_mcp_server', _raise)
        exit_code = cli_main.serve_main(['--package-dir', str(example_package_path)])
        assert exit_code == 1
        assert 'SCP package validation failed' in capsys.readouterr().err
