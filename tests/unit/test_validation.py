"""
Tests for package validation checks.
"""

from pathlib import Path
from shutil import copytree

from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME
from scicon.validation.checks import run_validation
from scicon.validation.results import Severity


class TestPackageValidation:
    """Tests for package-level validation results."""

    def test_example_validation_has_no_errors(
        self,
        example_package_path: Path,
    ) -> None:
        messages = run_validation(example_package_path)
        assert not [
            message for message in messages if message.severity == Severity.ERROR
        ]
        assert [message for message in messages if message.severity == Severity.WARNING]

    def test_validation_rejects_unknown_predicate(
        self,
        example_package_path: Path,
        tmp_path: Path,
    ) -> None:
        package_root = tmp_path / DEFAULT_PACKAGE_DIRNAME
        copytree(example_package_path, package_root)
        provenance = package_root / 'provenance.yaml'
        provenance.write_text(
            provenance.read_text(encoding='utf-8').replace(
                'predicate: supported_by',
                'predicate: free_text_link',
                1,
            ),
            encoding='utf-8',
        )
        messages = run_validation(package_root)
        assert any(
            message.severity == Severity.ERROR and message.field == 'predicate' and
            'Unknown predicate' in message.message for message in messages)

    def test_validation_rejects_removed_inverse_field(
        self,
        example_package_path: Path,
        tmp_path: Path,
    ) -> None:
        package_root = tmp_path / DEFAULT_PACKAGE_DIRNAME
        copytree(example_package_path, package_root)
        claims = package_root / 'claims.yaml'
        claims.write_text(
            claims.read_text(encoding='utf-8') +
            '\n    supporting_figures:\n      - fig_3\n',
            encoding='utf-8',
        )
        messages = run_validation(package_root)
        assert any(
            message.severity == Severity.ERROR and message.field == 'supporting_figures'
            for message in messages)

    def test_validation_allows_operation_execution_metadata(
        self,
        example_package_path: Path,
        tmp_path: Path,
    ) -> None:
        package_root = tmp_path / DEFAULT_PACKAGE_DIRNAME
        copytree(example_package_path, package_root)
        operations = package_root / 'operations.yaml'
        operations.write_text(
            operations.read_text(encoding='utf-8').replace(
                'execution_supported: false',
                'execution_supported: true',
            ),
            encoding='utf-8',
        )
        messages = run_validation(package_root)
        assert not any(message.severity == Severity.ERROR and
                       message.field == 'execution_supported' for message in messages)
