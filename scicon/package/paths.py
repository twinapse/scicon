"""
Path resolution and traversal guards for package files.
"""

import os
from pathlib import Path

from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME
from scicon.schema.filenames import MANIFEST_FILENAME

__all__ = [
    'default_package_dir',
    'resolve_package_dir',
    'resolve_package_file',
]


def default_package_dir(
    target_root: str | Path,
    package_dir: str | Path | None = None,
) -> Path:
    """
    Resolve the package directory without requiring it to exist.

    Args:
        target_root (str | Path): Root of the user's repository.
        package_dir (str | Path | None): Explicit package directory, when set.

    Returns:
        Path: Resolved package root candidate.
    """
    root = Path(target_root).expanduser().resolve()
    if package_dir is not None:
        candidate = Path(package_dir)
    elif os.environ.get('SCP_PACKAGE_DIR'):
        candidate = Path(os.environ['SCP_PACKAGE_DIR'])
    else:
        candidate = root / DEFAULT_PACKAGE_DIRNAME
    if not candidate.is_absolute():
        candidate = root / candidate
    return candidate.expanduser().resolve()


def resolve_package_dir(package_dir: str | Path | None = None) -> Path:
    """
    Resolve the package directory from CLI, environment, or cwd default.

    Args:
        package_dir (str | Path | None): Explicit package directory, when set.

    Returns:
        Path: Resolved package root.

    Raises:
        FileNotFoundError: If the package root or manifest is missing.
    """
    if package_dir is not None:
        candidate = Path(package_dir)
    elif os.environ.get('SCP_PACKAGE_DIR'):
        candidate = Path(os.environ['SCP_PACKAGE_DIR'])
    else:
        candidate = Path.cwd() / DEFAULT_PACKAGE_DIRNAME

    resolved = candidate.expanduser().resolve()
    if not resolved.is_dir():
        raise FileNotFoundError(f'SCP package directory not found: {resolved}')
    manifest = resolved / MANIFEST_FILENAME
    if not manifest.is_file():
        raise FileNotFoundError(f'SCP package manifest not found: {manifest}',)
    return resolved


def resolve_package_file(package_root: str | Path, relative_path: str | Path) -> Path:
    """
    Resolve a package-relative path and reject traversal outside the package.

    Args:
        package_root (str | Path): Package root directory.
        relative_path (str | Path): Package-relative file path.

    Returns:
        Path: Resolved package file path.

    Raises:
        ValueError: If ``relative_path`` is absolute or escapes the package root.
    """
    root = Path(package_root).expanduser().resolve()
    relative = Path(relative_path)
    if relative.is_absolute():
        raise ValueError(f'Package path must be relative: {relative_path}')
    resolved = (root / relative).resolve()
    if root != resolved and root not in resolved.parents:
        raise ValueError(f'Package path escapes root: {relative_path}')
    return resolved
