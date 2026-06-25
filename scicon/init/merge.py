"""
Pure merge helpers for `scicon init` target files.
"""

from collections import abc
import json
from typing import Any

import tomlkit
from tomlkit.exceptions import TOMLKitError

__all__ = [
    'SCP_MARKER_BEGIN',
    'SCP_MARKER_END',
    'merge_codex_toml',
    'merge_mcp_json',
    'remove_managed_block',
    'remove_codex_toml_server',
    'remove_mcp_server',
    'upsert_managed_block',
]

SCP_MARKER_BEGIN = '<!-- SCP START -->'
SCP_MARKER_END = '<!-- SCP END -->'


def upsert_managed_block(
    text: str,
    block: str,
    begin: str = SCP_MARKER_BEGIN,
    end: str = SCP_MARKER_END,
) -> str:
    """
    Insert or replace one marker-delimited markdown block.

    Args:
        text (str): Existing markdown text.
        block (str): Managed block body without markers.
        begin (str): Begin marker.
        end (str): End marker.

    Returns:
        str: Updated text with exactly one managed block.

    Raises:
        ValueError: If only one marker is present.
    """
    managed_block = _format_managed_block(block, begin, end)
    bounds = _find_marker_bounds(text, begin, end)
    if bounds is not None:
        start, stop = bounds
        return text[:start] + managed_block + text[stop:]
    if not text.strip():
        return managed_block + '\n'
    return text.rstrip() + '\n\n' + managed_block + '\n'


def remove_managed_block(
    text: str,
    begin: str = SCP_MARKER_BEGIN,
    end: str = SCP_MARKER_END,
) -> str:
    """
    Remove one marker-delimited markdown block.

    Args:
        text (str): Existing markdown text.
        begin (str): Begin marker.
        end (str): End marker.

    Returns:
        str: Text with the managed block removed.

    Raises:
        ValueError: If only one marker is present.
    """
    bounds = _find_marker_bounds(text, begin, end)
    if bounds is None:
        return text
    start, stop = bounds
    before = text[:start].rstrip()
    after = text[stop:].lstrip('\n')
    if before and after:
        return before + '\n\n' + after
    if before:
        return before + '\n'
    return after


def merge_mcp_json(
    existing: str | None,
    server_key: str,
    server_entry: abc.Mapping[str, Any],
) -> str:
    """
    Merge one MCP server entry into an existing ``.mcp.json`` document.

    Args:
        existing (str | None): Existing JSON text, or ``None`` for a new file.
        server_key (str): MCP server key to set.
        server_entry (Mapping[str, Any]): MCP server entry payload.

    Returns:
        str: Serialized JSON with a trailing newline.

    Raises:
        ValueError: If existing JSON is malformed or has an unsupported shape.
    """
    payload = _load_mcp_json(existing)
    servers = payload.setdefault('mcpServers', {})
    if not isinstance(servers, dict):
        raise ValueError('.mcp.json field "mcpServers" must be an object.')
    servers[server_key] = dict(server_entry)
    return json.dumps(payload, indent=2) + '\n'


def remove_mcp_server(existing: str | None, server_key: str) -> str | None:
    """
    Remove one MCP server entry from a ``.mcp.json`` document.

    Args:
        existing (str | None): Existing JSON text, or ``None`` if missing.
        server_key (str): MCP server key to remove.

    Returns:
        str | None: Serialized JSON, or ``None`` if there is no file to write.

    Raises:
        ValueError: If existing JSON is malformed or has an unsupported shape.
    """
    if existing is None:
        return None
    payload = _load_mcp_json(existing)
    servers = payload.get('mcpServers')
    if servers is None:
        return json.dumps(payload, indent=2) + '\n'
    if not isinstance(servers, dict):
        raise ValueError('.mcp.json field "mcpServers" must be an object.')
    servers.pop(server_key, None)
    return json.dumps(payload, indent=2) + '\n'


def merge_codex_toml(
    existing: str | None,
    server_key: str,
    server_entry: abc.Mapping[str, Any],
) -> str:
    """
    Merge one MCP server entry into a Codex ``.codex/config.toml`` document.

    Args:
        existing (str | None): Existing TOML text, or ``None`` for a new file.
        server_key (str): MCP server key to set.
        server_entry (Mapping[str, Any]): MCP server entry payload.

    Returns:
        str: Serialized TOML.

    Raises:
        ValueError: If existing TOML is malformed or has an unsupported shape.
    """
    payload = _load_codex_toml(existing)
    servers = payload.get('mcp_servers')
    if servers is None:
        servers = tomlkit.table()
        payload['mcp_servers'] = servers
    if not _is_toml_table(servers):
        raise ValueError(
            'Malformed .codex/config.toml: field "mcp_servers" must be a table.',)
    servers[server_key] = dict(server_entry)
    return tomlkit.dumps(payload)


def remove_codex_toml_server(
    existing: str | None,
    server_key: str,
) -> str | None:
    """
    Remove one MCP server entry from a Codex ``.codex/config.toml`` document.

    Args:
        existing (str | None): Existing TOML text, or ``None`` if missing.
        server_key (str): MCP server key to remove.

    Returns:
        str | None: Serialized TOML, or ``None`` if there is no file to write.

    Raises:
        ValueError: If existing TOML is malformed or has an unsupported shape.
    """
    if existing is None:
        return None
    payload = _load_codex_toml(existing)
    servers = payload.get('mcp_servers')
    if servers is None:
        return tomlkit.dumps(payload)
    if not _is_toml_table(servers):
        raise ValueError(
            'Malformed .codex/config.toml: field "mcp_servers" must be a table.',)
    servers.pop(server_key, None)
    if not servers and servers.is_super_table():
        payload['mcp_servers'] = tomlkit.table()
    return tomlkit.dumps(payload)


def _format_managed_block(block: str, begin: str, end: str) -> str:
    return begin + '\n' + block.strip() + '\n' + end


def _find_marker_bounds(
    text: str,
    begin: str,
    end: str,
) -> tuple[int, int] | None:
    start = text.find(begin)
    end_start = text.find(end)
    if start == -1 and end_start == -1:
        return None
    if start == -1 or end_start == -1:
        raise ValueError('SCP managed block markers are incomplete.')
    if end_start < start:
        raise ValueError('SCP managed block end marker appears before start marker.')
    return start, end_start + len(end)


def _load_mcp_json(existing: str | None) -> dict[str, Any]:
    if existing is None or not existing.strip():
        return {}
    try:
        payload = json.loads(existing)
    except json.JSONDecodeError as error:
        raise ValueError(f'Malformed .mcp.json: {error.msg}') from error
    if not isinstance(payload, dict):
        raise ValueError('.mcp.json must contain a JSON object.')
    return payload


def _load_codex_toml(existing: str | None) -> abc.MutableMapping[str, Any]:
    if existing is None or not existing.strip():
        return tomlkit.document()
    try:
        payload = tomlkit.parse(existing)
    except TOMLKitError as error:
        raise ValueError(f'Malformed .codex/config.toml: {error}') from error
    servers = payload.get('mcp_servers')
    if servers is not None and not isinstance(servers, abc.MutableMapping):
        raise ValueError(
            'Malformed .codex/config.toml: field "mcp_servers" must be a table.',)
    if servers is not None and not _is_toml_table(servers):
        raise ValueError(
            'Malformed .codex/config.toml: field "mcp_servers" must be a table.',)
    return payload


def _is_toml_table(value: object) -> bool:
    return (isinstance(value, abc.MutableMapping) and
            getattr(value, 'is_table', lambda: False)())
