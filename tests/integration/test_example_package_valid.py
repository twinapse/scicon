"""
Integration check for the shipped example package.
"""

from pathlib import Path

from scicon.validation.checks import run_validation
from scicon.validation.results import Severity


class TestExamplePackageValidation:
    """Tests for the shipped example package validation status."""

    def test_example_package_validates_without_errors(
        self,
        example_package_path: Path,
    ) -> None:
        messages = run_validation(example_package_path)
        errors = [message for message in messages if message.severity == Severity.ERROR]
        assert errors == []
