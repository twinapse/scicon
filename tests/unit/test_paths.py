"""
Tests for package path resolution.
"""

from pathlib import Path

import pytest

from scicon.package.paths import default_package_dir
from scicon.package.paths import resolve_package_dir
from scicon.package.paths import resolve_package_file
from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME


class TestPackageDirResolution:
    """Tests for package directory lookup order."""

    def test_resolve_package_dir_prefers_explicit_path(
        self,
        example_package_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv('SCP_PACKAGE_DIR', '/does/not/exist')
        assert resolve_package_dir(example_package_path) == example_package_path

    def test_resolve_package_dir_uses_environment(
        self,
        example_package_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv('SCP_PACKAGE_DIR', str(example_package_path))
        assert resolve_package_dir() == example_package_path

    def test_default_package_dir_uses_target_default_without_asserting(
        self,
        tmp_path: Path,
    ) -> None:
        assert default_package_dir(tmp_path) == tmp_path / DEFAULT_PACKAGE_DIRNAME

    def test_default_package_dir_prefers_explicit_path(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv('SCP_PACKAGE_DIR', '/does/not/exist')
        assert default_package_dir(tmp_path,
                                   'custom_package') == (tmp_path / 'custom_package')

    def test_default_package_dir_uses_environment(
        self,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        monkeypatch.setenv('SCP_PACKAGE_DIR', 'env_package')
        assert default_package_dir(tmp_path) == tmp_path / 'env_package'


class TestPackageFileResolution:
    """Tests for package file path safeguards."""

    def test_resolve_package_file_rejects_traversal(
        self,
        example_package_path: Path,
    ) -> None:
        with pytest.raises(ValueError):
            resolve_package_file(example_package_path, '../manifest.yaml')
