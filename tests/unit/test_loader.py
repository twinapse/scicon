"""
Tests for package loading.
"""

from pathlib import Path

from scicon.package.loader import load_package
from scicon.schema.filenames import DEFAULT_PACKAGE_DIRNAME


class TestPackageLoading:
    """Tests for loading package YAML into indexed package objects."""

    def test_load_example_package_builds_indexes(
        self,
        example_package_path: Path,
    ) -> None:
        package = load_package(example_package_path)
        assert package.study.id == 'temporal_recalibration_neuroscience_demo'
        assert package.get_object('claim_calibration_shift') is not None
        assert package.get_object_type('build_figure3').value == 'code_artifact'
        assert len(package.edges_for('claim_calibration_shift',
                                     direction='subject')) == 6

    def test_missing_optional_files_load_as_empty_collections(
        self,
        tmp_path: Path,
    ) -> None:
        package_root = tmp_path / DEFAULT_PACKAGE_DIRNAME
        package_root.mkdir()
        (package_root / 'manifest.yaml').write_text(
            '\n'.join([
                'id: tiny_study',
                'title: Tiny study',
                'authors: []',
                'summary: missing',
                'paper: missing',
                'repository: missing',
                'data_sources: []',
                'schema_version: scp-0.1',
                'conversion_status: missing',
            ],),
            encoding='utf-8',
        )
        package = load_package(package_root)
        assert not package.claims
        assert not package.edges
