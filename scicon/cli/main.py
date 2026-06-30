"""
CLI entry points for serving and validating SCP packages.
"""

import argparse
import logging
import os
from pathlib import Path
import sys

from scicon.init.agents import AGENT_KEYS
from scicon.init.agents import ALL_AGENT_KEY
from scicon.init.agents import select_agents
from scicon.init.installer import AlwaysOnMode
from scicon.init.installer import install
from scicon.init.installer import InstallResult
from scicon.init.installer import refresh
from scicon.init.installer import uninstall
from scicon.interface.server import build_mcp_server
from scicon.package.paths import default_package_dir
from scicon.package.paths import resolve_package_dir
from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME
from scicon.validation.checks import run_validation
from scicon.validation.results import format_validation_report
from scicon.validation.results import has_errors

__all__ = [
    'init_main',
    'main',
    'serve_main',
    'validate_main',
]

_LOGGER_NAME = 'scp'
logger = logging.getLogger(_LOGGER_NAME)


def serve_main(argv: list[str] | None = None) -> int:
    """
    Run the MCP server over stdio.

    Args:
        argv (list[str] | None): Optional CLI arguments.

    Returns:
        int: ``0`` on a clean server shutdown, ``1`` if the package directory is
            missing or the package fails validation.
    """
    parser = _build_parser('Run the MCP interface for an SCP package.',)
    args = parser.parse_args(argv)
    _configure_logging()
    return _run_serve(args)


def validate_main(argv: list[str] | None = None) -> int:
    """
    Validate an SCP package and print a report.

    Args:
        argv (list[str] | None): Optional CLI arguments.

    Returns:
        int: Process exit status.
    """
    parser = _build_parser('Validate an SCP package.')
    args = parser.parse_args(argv)
    _configure_logging()
    return _run_validate(args)


def init_main(argv: list[str] | None = None) -> int:
    """
    Bootstrap the user's repository for SCP-aware agent usage.

    Args:
        argv (list[str] | None): Optional CLI arguments.

    Returns:
        int: Process exit status.
    """
    parser = _build_init_parser()
    args = parser.parse_args(argv)
    _configure_logging()
    return _run_init(args)


def main(argv: list[str] | None = None) -> int:
    """
    Run unified Scientific Context Protocol tooling.

    Args:
        argv (list[str] | None): Optional CLI arguments.

    Returns:
        int: Process exit status.
    """
    parser = argparse.ArgumentParser(
        prog='scicon',
        description='Scientific Context Protocol tooling.',
    )
    subparsers = parser.add_subparsers(dest='command', required=True)

    init_parser = subparsers.add_parser(
        'init',
        help='Bootstrap your repository for SCP-aware agent usage.',
    )
    _add_init_args(init_parser)
    init_parser.set_defaults(handler=_run_init)

    serve_parser = subparsers.add_parser(
        'serve',
        help='Run the MCP interface.',
    )
    _add_package_dir_arg(serve_parser)
    serve_parser.set_defaults(handler=_run_serve)

    validate_parser = subparsers.add_parser(
        'validate',
        help='Validate an SCP package.',
    )
    _add_package_dir_arg(validate_parser)
    validate_parser.set_defaults(handler=_run_validate)

    args = parser.parse_args(argv)
    _configure_logging()
    return args.handler(args)


def _run_serve(args: argparse.Namespace) -> int:
    try:
        server = build_mcp_server(args.package_dir)
    except (FileNotFoundError, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        return 1
    logger.info('Serving SCP MCP interface over stdio')
    server.run()
    return 0


def _run_validate(args: argparse.Namespace) -> int:
    try:
        package_root = resolve_package_dir(args.package_dir)
    except FileNotFoundError as error:
        print(str(error), file=sys.stderr)
        return 1
    logger.info('Validating SCP package at %s', package_root)
    messages = run_validation(package_root)
    print(format_validation_report(
        package_path=str(package_root),
        messages=messages,
    ),)
    return 1 if has_errors(messages) else 0


def _run_init(args: argparse.Namespace) -> int:
    if args.uninstall and args.refresh:
        print('Choose only one of --uninstall or --refresh.', file=sys.stderr)
        return 1
    target_root = args.target.expanduser().resolve()
    if not target_root.is_dir():
        print(f'Repository directory not found: {target_root}', file=sys.stderr)
        return 1
    package_root = default_package_dir(target_root, args.package_dir)
    package_dir_value = _package_dir_value(target_root, package_root)
    agents = select_agents(args.agent)
    always_on: AlwaysOnMode = args.always_on
    try:
        if args.uninstall:
            result = uninstall(
                target_root=target_root,
                agents=agents,
                write_skill=not args.no_skill,
                write_mcp=not args.no_mcp,
                dry_run=args.dry_run,
            )
        elif args.refresh:
            result = refresh(
                target_root=target_root,
                agents=agents,
                package_dir=package_root,
                package_dir_value=package_dir_value,
                always_on=always_on,
                write_skill=not args.no_skill,
                write_mcp=not args.no_mcp,
                dry_run=args.dry_run,
            )
        else:
            result = install(
                target_root=target_root,
                agents=agents,
                package_dir=package_root,
                package_dir_value=package_dir_value,
                always_on=always_on,
                write_skill=not args.no_skill,
                write_mcp=not args.no_mcp,
                force=args.force,
                dry_run=args.dry_run,
            )
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    _print_init_result(result, package_dir_value=package_dir_value)
    return 0


def _build_parser(description: str) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=description)
    _add_package_dir_arg(parser)
    return parser


def _add_package_dir_arg(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        '--package-dir',
        type=Path,
        default=None,
        help=f'Path to a hand-authored {DEFAULT_PACKAGE_DIRNAME} directory.',
    )


def _build_init_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description='Bootstrap your repository for SCP-aware agent usage.',)
    _add_init_args(parser)
    return parser


def _add_init_args(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        'target',
        nargs='?',
        type=Path,
        default=Path('.'),
        help='Repository root to bootstrap.',
    )
    parser.add_argument(
        '--package-dir',
        type=Path,
        default=None,
        help='Package directory value to register for your repository.',
    )
    parser.add_argument(
        '--agent',
        action='append',
        choices=(*AGENT_KEYS, ALL_AGENT_KEY),
        default=None,
        help='Agent integration to write. Repeat to select multiple agents.',
    )
    parser.add_argument(
        '--always-on',
        choices=('auto', 'all', 'none'),
        default='auto',
        help='Where to write the prose always-on policy block.',
    )
    parser.add_argument(
        '--no-skill',
        action='store_true',
        help='Do not write agent skill or prompt files.',
    )
    parser.add_argument(
        '--no-mcp',
        action='store_true',
        help='Do not write or update MCP server registration files.',
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Rewrite managed files even when content is unchanged.',
    )
    parser.add_argument(
        '--uninstall',
        action='store_true',
        help='Remove managed SCP artifacts from your repository.',
    )
    parser.add_argument(
        '--refresh',
        action='store_true',
        help='Re-emit current canonical SCP artifacts.',
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Print intended changes without writing files.',
    )


def _package_dir_value(target_root: Path, package_root: Path) -> str:
    try:
        return package_root.relative_to(target_root).as_posix()
    except ValueError:
        return package_root.as_posix()


def _print_init_result(
    result: InstallResult,
    *,
    package_dir_value: str,
) -> None:
    output = sys.stderr if result.dry_run else sys.stdout
    print(result.summary(), file=output)
    if result.serve_command:
        print(
            _format_mcp_registration_message(
                serve_command=result.serve_command,
                package_dir_value=package_dir_value,
            ),
            file=output,
        )
    for warning in result.warnings:
        print(f'Warning: {warning}', file=sys.stderr)


def _format_mcp_registration_message(
    *,
    serve_command: str,
    package_dir_value: str,
) -> str:
    command_path = Path(serve_command)
    manual_command = f'{serve_command} serve --package-dir {package_dir_value}'
    if command_path.is_absolute():
        python_environment = command_path.parent.parent
        return ('MCP server registered. Configured Python environment: '
                f'{python_environment}. If your agent does not pick it up, run it '
                f'manually with: {manual_command}')
    return (f'MCP server registered with command {serve_command}. If your agent '
            f'does not pick it up, run it manually with: {manual_command}')


def _configure_logging() -> None:
    """
    Configure stderr logging for the scp command-line entry points.

    The log level is read from the ``SCP_LOG_LEVEL`` environment variable and
    defaults to ``INFO``. Unknown values fall back to ``INFO``. All output is
    written to stderr so it never corrupts the stdio MCP protocol stream on
    stdout. The function is idempotent: repeated calls do not add duplicate
    handlers.
    """
    scp_logger = logging.getLogger(_LOGGER_NAME)
    if scp_logger.handlers:
        return
    level_name = os.environ.get('SCP_LOG_LEVEL', 'INFO').upper()
    level = logging.getLevelNamesMapping().get(level_name, logging.INFO)
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(
        logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s'),)
    scp_logger.addHandler(handler)
    scp_logger.setLevel(level)
    scp_logger.propagate = False


if __name__ == '__main__':
    sys.exit(main())
