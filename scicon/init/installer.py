"""
Install, refresh, and uninstall `scicon init` target artifacts.
"""

from collections import abc
from dataclasses import dataclass
from pathlib import Path
import shutil
import sys
from typing import Literal

from scicon.init.agents import AgentDescriptor
from scicon.init.merge import merge_codex_toml
from scicon.init.merge import merge_mcp_json
from scicon.init.merge import remove_codex_toml_server
from scicon.init.merge import remove_managed_block
from scicon.init.merge import remove_mcp_server
from scicon.init.merge import SCP_MARKER_BEGIN
from scicon.init.merge import SCP_MARKER_END
from scicon.init.merge import upsert_managed_block
from scicon.init.templates_io import render_policy
from scicon.init.templates_io import render_template
from scicon.schema.filenames import MANIFEST_FILENAME

__all__ = [
    'AlwaysOnMode',
    'InstallResult',
    'SERVER_KEY',
    'install',
    'refresh',
    'uninstall',
]

AlwaysOnMode = Literal['auto', 'all', 'none']
SERVER_KEY = 'scp'
SERVE_COMMAND = 'scicon'


@dataclass
class InstallResult:
    """
    Summary of `scicon init` changes.

    Args:
        action (str): User-facing action name.
        written (list[Path]): Files written or that would be written.
        removed (list[Path]): Files removed or that would be removed.
        unchanged (list[Path]): Files left unchanged.
        warnings (list[str]): Non-fatal warnings.
        dry_run (bool): Whether no changes were written.
        serve_command (str | None): MCP server command registered for agents.
    """

    action: str
    written: list[Path]
    removed: list[Path]
    unchanged: list[Path]
    warnings: list[str]
    dry_run: bool
    serve_command: str | None = None

    def summary(self) -> str:
        """
        Format a concise human summary.

        Returns:
            str: Summary text.
        """
        prefix = 'Dry run: would ' if self.dry_run else ''
        return (f'{prefix}{self.action} SCP target artifacts: '
                f'{len(self.written)} written, '
                f'{len(self.removed)} removed, '
                f'{len(self.unchanged)} unchanged.')


def install(
    *,
    target_root: Path,
    agents: tuple[AgentDescriptor, ...],
    package_dir: Path,
    package_dir_value: str,
    always_on: AlwaysOnMode,
    write_skill: bool,
    write_mcp: bool,
    force: bool,
    dry_run: bool,
) -> InstallResult:
    """
    Install managed SCP artifacts into a target repository.

    Args:
        target_root (Path): Target repository root.
        agents (tuple[AgentDescriptor, ...]): Selected agents.
        package_dir (Path): Resolved package directory path.
        package_dir_value (str): Package directory value written to templates.
        always_on (AlwaysOnMode): Always-on policy mode.
        write_skill (bool): Whether to write skill and prompt files.
        write_mcp (bool): Whether to write MCP server registration files.
        force (bool): Whether to rewrite unchanged files.
        dry_run (bool): Whether to avoid filesystem writes.

    Returns:
        InstallResult: Summary of changes.
    """
    result = _new_result(action='install', dry_run=dry_run)
    mcp_content: list[tuple[Path, str]] = []
    if write_mcp:
        result.warnings.extend(_package_warnings(package_dir))
        serve_command = _resolve_serve_command()
        result.serve_command = serve_command
        if serve_command == SERVE_COMMAND:
            result.warnings.append(
                f'{SERVE_COMMAND} was not found next to the current Python '
                'interpreter or on PATH; agent launchers must be able to find '
                f'{SERVE_COMMAND} on PATH.',)
        server_entry = _mcp_server_entry(
            package_dir_value=package_dir_value,
            command=serve_command,
        )
        for mcp_file, mcp_format in _unique_mcp_targets(agents):
            path = target_root / mcp_file
            merge_helper, _ = _mcp_helpers(mcp_format)
            mcp_content.append((
                path,
                merge_helper(_read_text(path), SERVER_KEY, server_entry),
            ))
    policy_block = render_policy(
        package_dir=package_dir_value,
        server_key=SERVER_KEY,
    )
    for policy_file in _policy_files_for_install(agents, always_on):
        path = target_root / policy_file
        existing = _read_text(path)
        updated = upsert_managed_block(
            existing or '',
            policy_block,
            SCP_MARKER_BEGIN,
            SCP_MARKER_END,
        )
        _write_text(
            path=path,
            content=updated,
            result=result,
            force=force,
        )
    if write_skill:
        for agent in agents:
            path = target_root / agent.skill_path
            content = render_template(
                agent.skill_template,
                package_dir=package_dir_value,
                server_key=SERVER_KEY,
            )
            _write_text(
                path=path,
                content=content,
                result=result,
                force=force,
            )
    if write_mcp:
        for path, content in mcp_content:
            _write_text(
                path=path,
                content=content,
                result=result,
                force=force,
            )
    return result


def uninstall(
    *,
    target_root: Path,
    agents: tuple[AgentDescriptor, ...],
    write_skill: bool,
    write_mcp: bool,
    dry_run: bool,
) -> InstallResult:
    """
    Remove managed SCP artifacts from a target repository.

    Args:
        target_root (Path): Target repository root.
        agents (tuple[AgentDescriptor, ...]): Selected agents.
        write_skill (bool): Whether to remove skill and prompt files.
        write_mcp (bool): Whether to remove MCP server registration entries.
        dry_run (bool): Whether to avoid filesystem writes.

    Returns:
        InstallResult: Summary of changes.
    """
    result = _new_result(action='uninstall', dry_run=dry_run)
    mcp_content: list[tuple[Path, str | None]] = []
    if write_mcp:
        for mcp_file, mcp_format in _unique_mcp_targets(agents):
            path = target_root / mcp_file
            _, remove_helper = _mcp_helpers(mcp_format)
            mcp_content.append((
                path,
                remove_helper(_read_text(path), SERVER_KEY),
            ))
    for policy_file in _unique_policy_files(agents):
        path = target_root / policy_file
        existing = _read_text(path)
        if existing is None:
            result.unchanged.append(path)
            continue
        updated = remove_managed_block(
            existing,
            SCP_MARKER_BEGIN,
            SCP_MARKER_END,
        )
        if not updated.strip() and existing != updated:
            _remove_file(path=path, result=result)
            continue
        _write_text(
            path=path,
            content=updated,
            result=result,
            force=False,
        )
    if write_skill:
        for agent in agents:
            _remove_file(
                path=target_root / agent.skill_path,
                result=result,
            )
    if write_mcp:
        for path, content in mcp_content:
            if content is None:
                result.unchanged.append(path)
                continue
            _write_text(
                path=path,
                content=content,
                result=result,
                force=False,
            )
    return result


def refresh(
    *,
    target_root: Path,
    agents: tuple[AgentDescriptor, ...],
    package_dir: Path,
    package_dir_value: str,
    always_on: AlwaysOnMode,
    write_skill: bool,
    write_mcp: bool,
    dry_run: bool,
) -> InstallResult:
    """
    Re-emit current canonical SCP target artifacts.

    Args:
        target_root (Path): Target repository root.
        agents (tuple[AgentDescriptor, ...]): Selected agents.
        package_dir (Path): Resolved package directory path.
        package_dir_value (str): Package directory value written to templates.
        always_on (AlwaysOnMode): Always-on policy mode.
        write_skill (bool): Whether to write skill and prompt files.
        write_mcp (bool): Whether to write MCP server registration files.
        dry_run (bool): Whether to avoid filesystem writes.

    Returns:
        InstallResult: Summary of changes.
    """
    removed = uninstall(
        target_root=target_root,
        agents=agents,
        write_skill=write_skill,
        write_mcp=write_mcp,
        dry_run=dry_run,
    )
    installed = install(
        target_root=target_root,
        agents=agents,
        package_dir=package_dir,
        package_dir_value=package_dir_value,
        always_on=always_on,
        write_skill=write_skill,
        write_mcp=write_mcp,
        force=True,
        dry_run=dry_run,
    )
    return InstallResult(
        action='refresh',
        written=removed.written + installed.written,
        removed=removed.removed + installed.removed,
        unchanged=removed.unchanged + installed.unchanged,
        warnings=removed.warnings + installed.warnings,
        dry_run=dry_run,
        serve_command=installed.serve_command,
    )


def _new_result(*, action: str, dry_run: bool) -> InstallResult:
    return InstallResult(
        action=action,
        written=[],
        removed=[],
        unchanged=[],
        warnings=[],
        dry_run=dry_run,
    )


def _policy_files_for_install(
    agents: tuple[AgentDescriptor, ...],
    always_on: AlwaysOnMode,
) -> tuple[Path, ...]:
    if always_on == 'none':
        return ()
    if always_on == 'all':
        return _unique_policy_files(agents)
    return _unique_policy_files(
        tuple(agent for agent in agents if agent.needs_always_on_policy),)


def _unique_policy_files(agents: tuple[AgentDescriptor, ...]) -> tuple[Path, ...]:
    files: list[Path] = []
    for agent in agents:
        if agent.policy_file not in files:
            files.append(agent.policy_file)
    return tuple(files)


def _unique_mcp_targets(
    agents: tuple[AgentDescriptor, ...],) -> tuple[tuple[Path, str], ...]:
    targets: list[tuple[Path, str]] = []
    files: list[Path] = []
    for agent in agents:
        if agent.mcp_file in files:
            continue
        targets.append((agent.mcp_file, agent.mcp_format))
        files.append(agent.mcp_file)
    return tuple(targets)


def _mcp_helpers(
    mcp_format: str,
) -> tuple[
        abc.Callable[[str | None, str, abc.Mapping[str, object]], str],
        abc.Callable[[str | None, str], str | None],
]:
    if mcp_format == 'json':
        return merge_mcp_json, remove_mcp_server
    if mcp_format == 'toml':
        return merge_codex_toml, remove_codex_toml_server
    raise ValueError(f'Unsupported MCP registration format: {mcp_format}')


def _resolve_serve_command() -> str:
    """
    Resolve the `scicon` console script for MCP launchers.

    Returns:
        str: Absolute command path when found, otherwise the bare command name.
    """
    bin_dir = str(Path(sys.executable).parent)
    command = shutil.which(SERVE_COMMAND, path=bin_dir) or shutil.which(SERVE_COMMAND)
    if command is None:
        return SERVE_COMMAND
    return str(Path(command).resolve())


def _mcp_server_entry(*, package_dir_value: str, command: str) -> dict[str, object]:
    return {
        'command': command,
        'args': ['serve', '--package-dir', package_dir_value],
        'env': {
            'SCP_PACKAGE_DIR': package_dir_value,
        },
    }


def _package_warnings(package_dir: Path) -> list[str]:
    if not package_dir.is_dir():
        return [
            f'SCP package directory does not exist yet: {package_dir}',
        ]
    manifest = package_dir / MANIFEST_FILENAME
    if not manifest.is_file():
        return [
            f'SCP package manifest does not exist yet: {manifest}',
        ]
    return []


def _read_text(path: Path) -> str | None:
    if not path.exists():
        return None
    return path.read_text(encoding='utf-8')


def _write_text(
    *,
    path: Path,
    content: str,
    result: InstallResult,
    force: bool,
) -> None:
    existing = _read_text(path)
    if existing == content and not force:
        result.unchanged.append(path)
        return
    result.written.append(path)
    if result.dry_run:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')


def _remove_file(*, path: Path, result: InstallResult) -> None:
    if not path.exists():
        result.unchanged.append(path)
        return
    result.removed.append(path)
    if result.dry_run:
        return
    path.unlink()
