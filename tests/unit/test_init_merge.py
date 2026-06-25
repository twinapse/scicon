"""
Tests for `scicon init` merge helpers.
"""

import json
import tomllib

import pytest

from scicon.init.merge import merge_codex_toml
from scicon.init.merge import merge_mcp_json
from scicon.init.merge import remove_codex_toml_server
from scicon.init.merge import remove_managed_block
from scicon.init.merge import remove_mcp_server
from scicon.init.merge import SCP_MARKER_BEGIN
from scicon.init.merge import SCP_MARKER_END
from scicon.init.merge import upsert_managed_block
from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME


class TestManagedBlockMerge:
    """Tests for marker-delimited markdown merges."""

    def test_upsert_managed_block_inserts_and_is_idempotent(self) -> None:
        text = 'User notes.\n'
        block = 'Managed policy.'

        updated = upsert_managed_block(text, block)
        assert updated.count(SCP_MARKER_BEGIN) == 1
        assert updated.count(SCP_MARKER_END) == 1
        assert 'User notes.' in updated
        assert 'Managed policy.' in updated
        assert upsert_managed_block(updated, block) == updated

    def test_upsert_managed_block_replaces_existing_region(self) -> None:
        text = ('Before.\n\n'
                f'{SCP_MARKER_BEGIN}\n'
                'Stale policy.\n'
                f'{SCP_MARKER_END}\n\n'
                'After.\n')

        updated = upsert_managed_block(text, 'Fresh policy.')

        assert 'Before.' in updated
        assert 'After.' in updated
        assert 'Fresh policy.' in updated
        assert 'Stale policy.' not in updated
        assert updated.count(SCP_MARKER_BEGIN) == 1

    def test_remove_managed_block_strips_only_region(self) -> None:
        text = ('Before.\n\n'
                f'{SCP_MARKER_BEGIN}\n'
                'Managed policy.\n'
                f'{SCP_MARKER_END}\n\n'
                'After.\n')

        updated = remove_managed_block(text)

        assert updated == 'Before.\n\nAfter.\n'

    def test_incomplete_markers_raise_clear_error(self) -> None:
        with pytest.raises(ValueError, match='incomplete'):
            upsert_managed_block(f'{SCP_MARKER_BEGIN}\nStale\n', 'Fresh')


class TestMCPJSONMerge:
    """Tests for MCP JSON merge behavior."""

    def test_merge_mcp_json_preserves_foreign_servers(self) -> None:
        existing = json.dumps({
            'mcpServers': {
                'other': {
                    'command': 'other-serve',
                },
            },
            'note': 'keep me',
        })

        updated = json.loads(
            merge_mcp_json(
                existing,
                'scp',
                {
                    'command': 'scicon',
                    'args': ['serve', '--package-dir', DEFAULT_PACKAGE_DIRNAME],
                },
            ),)

        assert updated['note'] == 'keep me'
        assert updated['mcpServers']['other']['command'] == 'other-serve'
        assert updated['mcpServers']['scp']['command'] == 'scicon'

    def test_remove_mcp_server_preserves_foreign_servers(self) -> None:
        existing = json.dumps({
            'mcpServers': {
                'other': {
                    'command': 'other-serve',
                },
                'scp': {
                    'command': 'scicon',
                },
            },
        })

        updated = json.loads(remove_mcp_server(existing, 'scp') or '')

        assert 'scp' not in updated['mcpServers']
        assert updated['mcpServers']['other']['command'] == 'other-serve'

    def test_merge_mcp_json_rejects_malformed_json(self) -> None:
        with pytest.raises(ValueError, match='Malformed'):
            merge_mcp_json('{bad', 'scp', {'command': 'scicon'})


class TestCodexTOMLMerge:
    """Tests for Codex TOML merge behavior."""

    def test_merge_codex_toml_preserves_foreign_content(self) -> None:
        existing = ('model = "gpt-5"\n\n'
                    '[tools]\n'
                    'enabled = true\n')

        updated = tomllib.loads(
            merge_codex_toml(
                existing,
                'scp',
                {
                    'command': 'scicon',
                    'args': ['serve', '--package-dir', DEFAULT_PACKAGE_DIRNAME],
                    'env': {
                        'SCP_PACKAGE_DIR': DEFAULT_PACKAGE_DIRNAME,
                    },
                },
            ),)

        assert updated['model'] == 'gpt-5'
        assert updated['tools']['enabled'] is True
        assert updated['mcp_servers']['scp']['command'] == 'scicon'
        assert updated['mcp_servers']['scp']['args'] == [
            'serve',
            '--package-dir',
            DEFAULT_PACKAGE_DIRNAME,
        ]
        assert updated['mcp_servers']['scp']['env']['SCP_PACKAGE_DIR'] == (
            DEFAULT_PACKAGE_DIRNAME)

    def test_remove_codex_toml_server_preserves_foreign_servers(self) -> None:
        existing = ('[mcp_servers.other]\n'
                    'command = "other-serve"\n\n'
                    '[mcp_servers.scp]\n'
                    'command = "scicon"\n')

        updated = tomllib.loads(remove_codex_toml_server(existing, 'scp') or '')

        assert 'scp' not in updated['mcp_servers']
        assert updated['mcp_servers']['other']['command'] == 'other-serve'

    def test_remove_codex_toml_server_leaves_empty_mcp_servers_table(self) -> None:
        existing = ('[mcp_servers.scp]\n'
                    'command = "scicon"\n')

        output = remove_codex_toml_server(existing, 'scp')

        assert output is not None
        updated = tomllib.loads(output)
        assert updated['mcp_servers'] == {}

    def test_remove_codex_toml_server_preserves_parent_table_comments(self) -> None:
        existing = ('[mcp_servers]\n'
                    '# Keep this note.\n\n'
                    '[mcp_servers.scp]\n'
                    'command = "scicon"\n')

        output = remove_codex_toml_server(existing, 'scp')

        assert output is not None
        assert '# Keep this note.' in output
        updated = tomllib.loads(output)
        assert updated['mcp_servers'] == {}

    def test_merge_codex_toml_rejects_malformed_toml(self) -> None:
        with pytest.raises(ValueError, match='Malformed'):
            merge_codex_toml('{bad', 'scp', {'command': 'scicon'})

    def test_merge_codex_toml_rejects_non_table_mcp_servers(self) -> None:
        with pytest.raises(ValueError, match='Malformed'):
            merge_codex_toml(
                'mcp_servers = "bad"\n',
                'scp',
                {'command': 'scicon'},
            )

    def test_remove_codex_toml_server_rejects_inline_mcp_servers(self) -> None:
        existing = 'mcp_servers = { scp = { command = "scicon" } }\n'

        with pytest.raises(ValueError, match='Malformed'):
            remove_codex_toml_server(existing, 'scp')
