"""
Load hand-authored SCP package YAML into typed objects.
"""

from collections.abc import Callable
from pathlib import Path
from typing import Any

import yaml

from scicon.package.paths import resolve_package_dir
from scicon.package.paths import resolve_package_file
from scicon.schema.filenames import ASSUMPTIONS_FILENAME
from scicon.schema.filenames import CLAIMS_FILENAME
from scicon.schema.filenames import CODEBASE_FILENAME
from scicon.schema.filenames import DATASETS_FILENAME
from scicon.schema.filenames import FIGURES_FILENAME
from scicon.schema.filenames import MANIFEST_FILENAME
from scicon.schema.filenames import METHODS_FILENAME
from scicon.schema.filenames import OPERATIONS_FILENAME
from scicon.schema.filenames import PAPER_FILENAME
from scicon.schema.filenames import PROVENANCE_FILENAME
from scicon.schema.filenames import RELATED_WORK_FILENAME
from scicon.schema.objects import Assumption
from scicon.schema.objects import Claim
from scicon.schema.objects import CodeArtifact
from scicon.schema.objects import Dataset
from scicon.schema.objects import Edge
from scicon.schema.objects import Figure
from scicon.schema.objects import MethodStep
from scicon.schema.objects import OperationRecipe
from scicon.schema.objects import PaperSection
from scicon.schema.objects import RelatedWork
from scicon.schema.objects import SCPPackage
from scicon.schema.objects import Study
from scicon.schema.status import Confidence
from scicon.schema.status import EvidenceStatus

__all__ = [
    'load_package',
    'load_yaml_file',
]


def load_package(package_dir: str | Path | None = None) -> SCPPackage:
    """
    Load an SCP package from YAML files.

    Args:
        package_dir (str | Path | None): Optional package directory override.

    Returns:
        SCPPackage: Loaded package container.
    """
    root = resolve_package_dir(package_dir)
    return SCPPackage(
        root=str(root),
        study=_load_study(root),
        paper_sections=_load_collection(
            root,
            PAPER_FILENAME,
            'sections',
            PaperSection,
        ),
        claims=_load_collection(root, CLAIMS_FILENAME, 'claims', Claim),
        figures=_load_collection(root, FIGURES_FILENAME, 'figures', Figure),
        datasets=_load_collection(root, DATASETS_FILENAME, 'datasets', Dataset),
        methods=_load_collection(root, METHODS_FILENAME, 'methods', MethodStep),
        code_artifacts=_load_collection(
            root,
            CODEBASE_FILENAME,
            'code_artifacts',
            CodeArtifact,
        ),
        assumptions=_load_collection(
            root,
            ASSUMPTIONS_FILENAME,
            'assumptions',
            Assumption,
        ),
        related_work=_load_collection(
            root,
            RELATED_WORK_FILENAME,
            'related_work',
            RelatedWork,
        ),
        operations=_load_collection(
            root,
            OPERATIONS_FILENAME,
            'operations',
            OperationRecipe,
        ),
        edges=_load_collection(root, PROVENANCE_FILENAME, 'edges', Edge),
    )


def load_yaml_file(package_root: str | Path, filename: str) -> dict[str, Any]:
    """
    Load a known YAML file from a package root.

    Args:
        package_root (str | Path): Package root directory.
        filename (str): Package-relative YAML filename.

    Returns:
        dict[str, Any]: Parsed YAML mapping, or an empty mapping for empty files.

    Raises:
        TypeError: If the YAML root is not a mapping.
    """
    path = resolve_package_file(package_root, filename)
    with path.open('r', encoding='utf-8') as file_obj:
        payload = yaml.safe_load(file_obj) or {}
    if not isinstance(payload, dict):
        raise TypeError(f'{filename} must contain a YAML mapping')
    return payload


def _load_study(package_root: Path) -> Study:
    raw = load_yaml_file(package_root, MANIFEST_FILENAME)
    data = raw.get('study', raw)
    return _build_dataclass(data, Study)


def _load_collection(
    package_root: Path,
    filename: str,
    collection_key: str,
    factory: Callable[..., Any],
) -> list[Any]:
    path = resolve_package_file(package_root, filename)
    if not path.exists():
        return []
    raw = load_yaml_file(package_root, filename)
    values = _collection_values(raw, collection_key)
    return [_build_dataclass(item, factory) for item in values]


def _collection_values(
    raw: dict[str, Any],
    collection_key: str,
) -> list[dict[str, Any]]:
    values = raw.get(collection_key)
    if values is None:
        values = []
    if isinstance(values, dict):
        values = list(values.values())
    if not isinstance(values, list):
        raise TypeError(f'{collection_key} must be a list')
    return [value for value in values if isinstance(value, dict)]


def _build_dataclass(data: dict[str, Any], factory: Callable[..., Any]) -> Any:
    normalized = dict(data)
    if 'evidence_status' in normalized:
        normalized['evidence_status'] = _coerce_status(normalized['evidence_status'],)
    if factory is Study and 'conversion_status' in normalized:
        normalized['conversion_status'] = _coerce_status(
            normalized['conversion_status'],)
    if factory is Figure and 'reproduction_status' in normalized:
        normalized['reproduction_status'] = _coerce_status(
            normalized['reproduction_status'],)
    if factory is Edge and 'confidence' in normalized:
        normalized['confidence'] = _coerce_confidence(normalized['confidence'])
    allowed = factory.__dataclass_fields__.keys()
    filtered = {key: value for key, value in normalized.items() if key in allowed}
    return factory(**filtered)


def _coerce_status(value: Any) -> EvidenceStatus | str:
    try:
        return EvidenceStatus(str(value))
    except ValueError:
        return str(value)


def _coerce_confidence(value: Any) -> Confidence | str:
    try:
        return Confidence(str(value))
    except ValueError:
        return str(value)
