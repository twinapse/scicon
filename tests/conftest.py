"""
Shared test fixtures.
"""

from pathlib import Path

import pytest

from scicon.package.loader import load_package
from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME
from scicon.schema.objects import SCPPackage


@pytest.fixture
def example_package_path() -> Path:
    """
    Return the example package path.
    """
    return Path(__file__).resolve().parents[1] / 'examples' / DEFAULT_PACKAGE_DIRNAME


@pytest.fixture
def example_package(example_package_path: Path,) -> SCPPackage:
    """
    Return the loaded example package.
    """
    return load_package(example_package_path)
