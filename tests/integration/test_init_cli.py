"""
Tests for the `scicon init` CLI entry point.
"""

import json
from pathlib import Path
import tomllib
from typing import Any

import pytest

from scicon.cli import main as cli_main
from scicon.init.installer import SERVE_COMMAND
from scicon.init.merge import SCP_MARKER_BEGIN
from scicon.init.merge import SCP_MARKER_END
from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME


class TestInitMain:
    """Tests for target-repo bootstrap behavior."""

    def test_fresh_install_default_auto_writes_expected_artifacts(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        exit_code = cli_main.init_main([str(tmp_path)])

        assert exit_code == 0
        assert not (tmp_path / 'AGENTS.md').exists()
        copilot_policy = (tmp_path / '.github' /
                          'copilot-instructions.md').read_text(encoding='utf-8')
        assert SCP_MARKER_BEGIN in copilot_policy
        assert 'query the `scp` MCP tools first' in copilot_policy
        assert (tmp_path / '.claude/skills/scp/SKILL.md').is_file()
        assert (tmp_path / '.agents/skills/scp/SKILL.md').is_file()
        assert (tmp_path / '.github/prompts/scp.prompt.md').is_file()
        mcp = _read_json(tmp_path / '.mcp.json')
        entry = mcp['mcpServers']['scp']
        serve_command = _assert_serve_command(entry['command'])
        assert entry['args'] == ['serve', '--package-dir', DEFAULT_PACKAGE_DIRNAME]
        assert entry['args'][0] == 'serve'
        assert entry['env']['SCP_PACKAGE_DIR'] == DEFAULT_PACKAGE_DIRNAME
        codex = _read_toml(tmp_path / '.codex/config.toml')
        _assert_scp_toml_entry(codex)
        captured = capsys.readouterr()
        assert 'Configured Python environment' in captured.out
        assert str(serve_command) in captured.out
        assert (f'{serve_command} serve --package-dir {DEFAULT_PACKAGE_DIRNAME}'
                in captured.out)

    def test_rerun_is_byte_idempotent(self, tmp_path: Path) -> None:
        assert cli_main.init_main([str(tmp_path)]) == 0
        before = _file_bytes(tmp_path)

        assert cli_main.init_main([str(tmp_path)]) == 0
        after = _file_bytes(tmp_path)

        assert after == before
        codex = _read_toml(tmp_path / '.codex/config.toml')
        _assert_scp_toml_entry(codex)
        copilot_policy = (tmp_path / '.github' /
                          'copilot-instructions.md').read_text(encoding='utf-8')
        assert copilot_policy.count(SCP_MARKER_BEGIN) == 1
        assert copilot_policy.count(SCP_MARKER_END) == 1

    def test_always_on_all_replaces_stale_agents_block(
        self,
        tmp_path: Path,
    ) -> None:
        agents = tmp_path / 'AGENTS.md'
        agents.write_text(
            'User intro.\n\n'
            f'{SCP_MARKER_BEGIN}\n'
            'Stale policy.\n'
            f'{SCP_MARKER_END}\n\n'
            'User outro.\n',
            encoding='utf-8',
        )

        exit_code = cli_main.init_main([
            str(tmp_path),
            '--always-on',
            'all',
        ])

        assert exit_code == 0
        content = agents.read_text(encoding='utf-8')
        assert 'User intro.' in content
        assert 'User outro.' in content
        assert 'Stale policy.' not in content
        assert 'query the `scp` MCP tools first' in content
        assert content.count(SCP_MARKER_BEGIN) == 1

    def test_mcp_merge_preserves_existing_servers(self, tmp_path: Path) -> None:
        (tmp_path / '.mcp.json').write_text(
            json.dumps({
                'mcpServers': {
                    'other': {
                        'command': 'other-serve',
                    },
                },
                'note': 'keep me',
            }),
            encoding='utf-8',
        )

        exit_code = cli_main.init_main([str(tmp_path)])

        assert exit_code == 0
        mcp = _read_json(tmp_path / '.mcp.json')
        assert mcp['note'] == 'keep me'
        assert mcp['mcpServers']['other']['command'] == 'other-serve'
        _assert_serve_command(mcp['mcpServers']['scp']['command'])

    def test_agent_selection_and_suppression_flags(self, tmp_path: Path) -> None:
        exit_code = cli_main.init_main([
            str(tmp_path),
            '--agent',
            'codex',
            '--no-mcp',
        ])

        assert exit_code == 0
        assert (tmp_path / '.agents/skills/scp/SKILL.md').is_file()
        assert not (tmp_path / '.claude/skills/scp/SKILL.md').exists()
        assert not (tmp_path / '.github/prompts/scp.prompt.md').exists()
        assert not (tmp_path / '.mcp.json').exists()
        assert not (tmp_path / '.codex/config.toml').exists()
        assert not (tmp_path / 'AGENTS.md').exists()

        other_target = tmp_path / 'other'
        other_target.mkdir()
        exit_code = cli_main.init_main([
            str(other_target),
            '--agent',
            'copilot',
            '--no-skill',
        ])

        assert exit_code == 0
        assert (other_target / '.github/copilot-instructions.md').is_file()
        assert not (other_target / '.github/prompts/scp.prompt.md').exists()
        assert (other_target / '.mcp.json').is_file()
        assert not (other_target / '.codex/config.toml').exists()

    def test_codex_agent_writes_codex_config_only(self, tmp_path: Path) -> None:
        exit_code = cli_main.init_main([
            str(tmp_path),
            '--agent',
            'codex',
        ])

        assert exit_code == 0
        assert (tmp_path / '.agents/skills/scp/SKILL.md').is_file()
        assert not (tmp_path / '.mcp.json').exists()
        codex = _read_toml(tmp_path / '.codex/config.toml')
        _assert_scp_toml_entry(codex)

    @pytest.mark.parametrize(
        ('mode', 'has_agents_policy', 'has_copilot_policy'),
        [
            ('auto', False, True),
            ('all', True, True),
            ('none', False, False),
        ],
    )
    def test_always_on_modes(
        self,
        tmp_path: Path,
        mode: str,
        has_agents_policy: bool,
        has_copilot_policy: bool,
    ) -> None:
        target = tmp_path / mode
        target.mkdir()

        exit_code = cli_main.init_main([
            str(target),
            '--always-on',
            mode,
        ])

        assert exit_code == 0
        assert (target / 'AGENTS.md').exists() is has_agents_policy
        assert (target /
                '.github/copilot-instructions.md').exists() is has_copilot_policy
        assert (target / '.github/prompts/scp.prompt.md').is_file()
        assert (target / '.mcp.json').is_file()
        codex = _read_toml(target / '.codex/config.toml')
        _assert_scp_toml_entry(codex)

    def test_codex_toml_merge_preserves_user_content(
        self,
        tmp_path: Path,
    ) -> None:
        codex_config = tmp_path / '.codex/config.toml'
        codex_config.parent.mkdir()
        codex_config.write_text(
            '# User Codex config.\n'
            'model = "gpt-5"\n\n'
            '[tools]\n'
            'enabled = true\n',
            encoding='utf-8',
        )

        exit_code = cli_main.init_main([str(tmp_path)])

        assert exit_code == 0
        content = codex_config.read_text(encoding='utf-8')
        assert '# User Codex config.' in content
        codex = tomllib.loads(content)
        assert codex['model'] == 'gpt-5'
        assert codex['tools']['enabled'] is True
        _assert_scp_toml_entry(codex)

    def test_uninstall_removes_managed_artifacts_and_keeps_foreign_content(
        self,
        tmp_path: Path,
    ) -> None:
        (tmp_path / '.mcp.json').write_text(
            json.dumps({
                'mcpServers': {
                    'other': {
                        'command': 'other-serve',
                    },
                },
            }),
            encoding='utf-8',
        )
        codex_config = tmp_path / '.codex/config.toml'
        codex_config.parent.mkdir()
        codex_config.write_text(
            '[mcp_servers.other]\n'
            'command = "other-serve"\n\n'
            '[project]\n'
            'name = "keep me"\n',
            encoding='utf-8',
        )
        assert cli_main.init_main([str(tmp_path), '--always-on', 'all']) == 0
        agents = tmp_path / 'AGENTS.md'
        agents.write_text(
            'User intro.\n\n' + agents.read_text(encoding='utf-8'),
            encoding='utf-8',
        )

        exit_code = cli_main.init_main([str(tmp_path), '--uninstall'])

        assert exit_code == 0
        agents_content = agents.read_text(encoding='utf-8')
        assert agents_content == 'User intro.\n'
        assert not (tmp_path / '.claude/skills/scp/SKILL.md').exists()
        assert not (tmp_path / '.agents/skills/scp/SKILL.md').exists()
        assert not (tmp_path / '.github/prompts/scp.prompt.md').exists()
        mcp = _read_json(tmp_path / '.mcp.json')
        assert 'scp' not in mcp['mcpServers']
        assert mcp['mcpServers']['other']['command'] == 'other-serve'
        codex = _read_toml(codex_config)
        assert 'scp' not in codex['mcp_servers']
        assert codex['mcp_servers']['other']['command'] == 'other-serve'
        assert codex['project']['name'] == 'keep me'

    def test_uninstall_deletes_policy_file_with_only_managed_content(
        self,
        tmp_path: Path,
    ) -> None:
        assert cli_main.init_main([str(tmp_path)]) == 0
        copilot_policy = tmp_path / '.github/copilot-instructions.md'
        assert copilot_policy.is_file()

        exit_code = cli_main.init_main([str(tmp_path), '--uninstall'])

        assert exit_code == 0
        assert not copilot_policy.exists()

    def test_refresh_removes_policy_blocks_excluded_by_new_mode(
        self,
        tmp_path: Path,
    ) -> None:
        assert cli_main.init_main([str(tmp_path), '--always-on', 'all']) == 0
        assert SCP_MARKER_BEGIN in (tmp_path / 'AGENTS.md').read_text(encoding='utf-8')
        assert SCP_MARKER_BEGIN in (tmp_path /
                                    '.github/copilot-instructions.md').read_text(
                                        encoding='utf-8')

        exit_code = cli_main.init_main([
            str(tmp_path),
            '--refresh',
            '--always-on',
            'none',
        ])

        assert exit_code == 0
        assert not (tmp_path / 'AGENTS.md').exists()
        assert not (tmp_path / '.github/copilot-instructions.md').exists()
        assert (tmp_path / '.agents/skills/scp/SKILL.md').is_file()
        assert (tmp_path / '.mcp.json').is_file()
        assert (tmp_path / '.codex/config.toml').is_file()

    def test_dry_run_writes_nothing(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        exit_code = cli_main.init_main([str(tmp_path), '--dry-run'])

        assert exit_code == 0
        assert not list(tmp_path.iterdir())
        assert 'Dry run' in capsys.readouterr().err

    def test_missing_target_returns_one(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        exit_code = cli_main.init_main([str(tmp_path / 'missing')])

        assert exit_code == 1
        assert 'not found' in capsys.readouterr().err

    def test_malformed_mcp_json_returns_one_without_clobbering(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        mcp = tmp_path / '.mcp.json'
        mcp.write_text('{bad', encoding='utf-8')

        exit_code = cli_main.init_main([str(tmp_path)])

        assert exit_code == 1
        assert mcp.read_text(encoding='utf-8') == '{bad'
        assert 'Malformed .mcp.json' in capsys.readouterr().err

    def test_malformed_codex_toml_returns_one_without_clobbering(
        self,
        tmp_path: Path,
        capsys: pytest.CaptureFixture[str],
    ) -> None:
        codex_config = tmp_path / '.codex/config.toml'
        codex_config.parent.mkdir()
        codex_config.write_text('{bad', encoding='utf-8')

        exit_code = cli_main.init_main([str(tmp_path)])

        assert exit_code == 1
        assert codex_config.read_text(encoding='utf-8') == '{bad'
        assert not (tmp_path / '.mcp.json').exists()
        assert not (tmp_path / '.claude/skills/scp/SKILL.md').exists()
        assert 'Malformed .codex/config.toml' in capsys.readouterr().err


def _read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding='utf-8'))


def _read_toml(path: Path) -> dict[str, Any]:
    return tomllib.loads(path.read_text(encoding='utf-8'))


def _assert_scp_toml_entry(codex: dict[str, Any]) -> None:
    entry = codex['mcp_servers']['scp']
    _assert_serve_command(entry['command'])
    assert entry['args'] == ['serve', '--package-dir', DEFAULT_PACKAGE_DIRNAME]
    assert entry['args'][0] == 'serve'
    assert entry['env']['SCP_PACKAGE_DIR'] == DEFAULT_PACKAGE_DIRNAME


def _assert_serve_command(command: object) -> Path:
    assert isinstance(command, str)
    command_path = Path(command)
    assert command_path.is_absolute()
    assert command_path.name == SERVE_COMMAND
    return command_path


def _file_bytes(root: Path) -> dict[Path, bytes]:
    return {
        path.relative_to(root): path.read_bytes()
        for path in sorted(root.rglob('*'))
        if path.is_file()
    }
