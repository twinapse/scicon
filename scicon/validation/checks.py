"""
Validation checks for hand-authored SCP packages.
"""

from collections import Counter
from dataclasses import fields
from pathlib import Path
from typing import Any

import yaml

from scicon.package.loader import load_package
from scicon.package.paths import resolve_package_dir
from scicon.package.paths import resolve_package_file
from scicon.schema.filenames import KNOWN_PACKAGE_FILENAMES
from scicon.schema.filenames import MANIFEST_FILENAME
from scicon.schema.filenames import OPERATIONS_FILENAME
from scicon.schema.filenames import PAPER_FILENAME
from scicon.schema.filenames import PROVENANCE_FILENAME
from scicon.schema.objects import PackageObject
from scicon.schema.objects import SCPPackage
from scicon.schema.predicates import is_allowed_edge
from scicon.schema.predicates import is_known_predicate
from scicon.schema.status import EvidenceStatus
from scicon.schema.status import is_known_confidence
from scicon.schema.status import is_known_status
from scicon.validation.results import Severity
from scicon.validation.results import ValidationMessage

__all__ = [
    'run_validation',
]

BANNED_INVERSE_FIELDS = {
    'supporting_figures',
    'supporting_datasets',
    'supporting_code',
    'supporting_methods',
    'assumptions',
    'source_data',
    'analysis_code',
    'claims',
    'methods',
    'related_figures',
    'related_claims',
    'affected_claims',
    'affected_figures',
    'affected_methods',
    'reused_methods',
    'related_artifacts',
}

UNCERTAIN_STATUSES = {
    EvidenceStatus.MISSING.value,
    EvidenceStatus.AMBIGUOUS.value,
    EvidenceStatus.UNRESOLVED.value,
}


def run_validation(package_dir: str | Path | None = None) -> list[ValidationMessage]:
    """
    Run structural validation checks on an SCP package.

    Args:
        package_dir (str | Path | None): Optional package directory override.

    Returns:
        list[ValidationMessage]: Validation findings.
    """
    messages: list[ValidationMessage] = []
    try:
        root = resolve_package_dir(package_dir)
    except FileNotFoundError as error:
        return [
            ValidationMessage(
                Severity.ERROR,
                MANIFEST_FILENAME,
                None,
                None,
                str(error),
                'Create a package root containing manifest.yaml.',
            ),
        ]

    raw_files = _load_known_yaml(root, messages)
    if _has_parse_errors(messages):
        return messages

    _check_removed_inverse_fields(raw_files, messages)
    try:
        package = load_package(root)
    except (TypeError, ValueError) as error:
        messages.append(
            ValidationMessage(
                Severity.ERROR,
                MANIFEST_FILENAME,
                None,
                None,
                f'Package could not be loaded: {error}',
                'Fix malformed object collections and required object IDs.',
            ),)
        return messages

    _check_unique_ids(package, messages)
    _check_status_values(package, messages)
    _check_edges(package, messages)
    _check_claim_sections(package, messages)
    _check_uncertain_fields(package, messages)
    _append_coverage_info(package, messages)
    return messages


def _load_known_yaml(
    root: Path,
    messages: list[ValidationMessage],
) -> dict[str, Any]:
    raw_files: dict[str, Any] = {}
    for filename in KNOWN_PACKAGE_FILENAMES:
        path = resolve_package_file(root, filename)
        if not path.exists():
            if filename == MANIFEST_FILENAME:
                messages.append(
                    ValidationMessage(
                        Severity.ERROR,
                        filename,
                        None,
                        None,
                        'Required package file is missing.',
                        'Add manifest.yaml.',
                    ),)
            continue
        try:
            with path.open('r', encoding='utf-8') as file_obj:
                raw_files[filename] = yaml.safe_load(file_obj) or {}
        except yaml.YAMLError as error:
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    filename,
                    None,
                    None,
                    f'YAML parse error: {error}',
                    'Fix the YAML syntax.',
                ),)
    return raw_files


def _has_parse_errors(messages: list[ValidationMessage]) -> bool:
    return any(
        message.severity == Severity.ERROR and 'YAML parse error' in message.message
        for message in messages)


def _check_removed_inverse_fields(
    raw_files: dict[str, Any],
    messages: list[ValidationMessage],
) -> None:
    for filename, payload in raw_files.items():
        _walk_for_removed_fields(
            filename=filename,
            payload=payload,
            messages=messages,
            object_id=None,
        )


def _walk_for_removed_fields(
    *,
    filename: str,
    payload: Any,
    messages: list[ValidationMessage],
    object_id: str | None,
) -> None:
    if isinstance(payload, dict):
        current_id = str(payload.get('id',
                                     object_id)) if payload.get('id') else object_id
        for key, value in payload.items():
            allowed_paper_section_field = (filename == PAPER_FILENAME and
                                           key in {'related_claims', 'related_figures'})
            allowed_collection_key = object_id is None and key in {
                'assumptions',
                'claims',
                'methods',
            }
            if (key in BANNED_INVERSE_FIELDS and not allowed_paper_section_field and
                    not allowed_collection_key):
                messages.append(
                    ValidationMessage(
                        Severity.ERROR,
                        filename,
                        current_id,
                        key,
                        'Removed inverse relationship field is not allowed.',
                        'Represent cross-object links in provenance.yaml.',
                    ),)
            _walk_for_removed_fields(
                filename=filename,
                payload=value,
                messages=messages,
                object_id=current_id,
            )
    elif isinstance(payload, list):
        for item in payload:
            _walk_for_removed_fields(
                filename=filename,
                payload=item,
                messages=messages,
                object_id=object_id,
            )


def _check_unique_ids(
    package: SCPPackage,
    messages: list[ValidationMessage],
) -> None:
    object_ids = [package.study.id]
    for objects in package.typed_collections().values():
        object_ids.extend(package_object.id for package_object in objects)
    edge_ids = [edge.id for edge in package.edges]
    _append_duplicate_errors(
        values=object_ids,
        file='package objects',
        messages=messages,
    )
    _append_duplicate_errors(
        values=edge_ids,
        file=PROVENANCE_FILENAME,
        messages=messages,
    )


def _append_duplicate_errors(
    *,
    values: list[str],
    file: str,
    messages: list[ValidationMessage],
) -> None:
    for value, count in Counter(values).items():
        if count > 1:
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    file,
                    value,
                    'id',
                    'ID must be unique.',
                    'Rename one of the duplicate IDs.',
                ),)


def _check_status_values(
    package: SCPPackage,
    messages: list[ValidationMessage],
) -> None:
    for package_object in _all_objects(package):
        for field_name in _status_field_names(package_object):
            value = getattr(package_object, field_name)
            if not is_known_status(value):
                messages.append(
                    ValidationMessage(
                        Severity.ERROR,
                        _file_for_object(package_object),
                        package_object.id,
                        field_name,
                        f'Unsupported evidence status: {value}',
                        'Use the closed evidence-status vocabulary.',
                    ),)
    for edge in package.edges:
        if not is_known_status(edge.evidence_status):
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'evidence_status',
                    f'Unsupported evidence status: {edge.evidence_status}',
                    'Use the closed evidence-status vocabulary.',
                ),)
        if not is_known_confidence(edge.confidence):
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'confidence',
                    f'Unsupported confidence: {edge.confidence}',
                    'Use high, medium, or low.',
                ),)


def _check_edges(
    package: SCPPackage,
    messages: list[ValidationMessage],
) -> None:
    for edge in package.edges:
        if not is_known_predicate(edge.predicate):
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'predicate',
                    f'Unknown predicate: {edge.predicate}',
                    'Use the closed predicate vocabulary.',
                ),)
            continue
        subject_type = package.get_object_type(edge.subject)
        object_type = package.get_object_type(edge.object)
        if subject_type is None:
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'subject',
                    f'Edge subject does not resolve: {edge.subject}',
                    'Add the referenced object or change the edge subject.',
                ),)
        if object_type is None:
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'object',
                    f'Edge object does not resolve: {edge.object}',
                    'Add the referenced object or change the edge object.',
                ),)
        if subject_type is None or object_type is None:
            continue
        if not is_allowed_edge(
                predicate=edge.predicate,
                subject_type=subject_type,
                object_type=object_type,
        ):
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'predicate',
                    (f'Predicate {edge.predicate} is not legal for '
                     f'{subject_type.value} -> {object_type.value}.'),
                    'Change the predicate or referenced object types.',
                ),)


def _check_claim_sections(
    package: SCPPackage,
    messages: list[ValidationMessage],
) -> None:
    section_ids = {section.id for section in package.paper_sections}
    if not section_ids:
        return
    for claim in package.claims:
        if str(claim.section) in UNCERTAIN_STATUSES:
            continue
        if claim.section not in section_ids:
            messages.append(
                ValidationMessage(
                    Severity.ERROR,
                    'claims.yaml',
                    claim.id,
                    'section',
                    f'Claim section does not resolve: {claim.section}',
                    ('Use a paper.yaml section ID or mark the section '
                     'missing/ambiguous.'),
                ),)


def _check_uncertain_fields(
    package: SCPPackage,
    messages: list[ValidationMessage],
) -> None:
    for package_object in _all_objects(package):
        for field_info in fields(package_object):
            if field_info.name.startswith('_'):
                continue
            value = getattr(package_object, field_info.name)
            if _is_uncertain(value):
                messages.append(
                    ValidationMessage(
                        Severity.WARNING,
                        _file_for_object(package_object),
                        package_object.id,
                        field_info.name,
                        'Field is missing, ambiguous, or unresolved.',
                        ('Fill the field when source evidence or author '
                         'confirmation exists.'),
                    ),)
    for edge in package.edges:
        if str(edge.evidence_status) in UNCERTAIN_STATUSES:
            messages.append(
                ValidationMessage(
                    Severity.WARNING,
                    PROVENANCE_FILENAME,
                    edge.id,
                    'evidence_status',
                    'Edge is missing, ambiguous, or unresolved.',
                    'Resolve or preserve uncertainty explicitly.',
                ),)


def _append_coverage_info(
    package: SCPPackage,
    messages: list[ValidationMessage],
) -> None:
    messages.append(
        ValidationMessage(
            Severity.INFO,
            'package',
            None,
            None,
            (f'Loaded {len(package.claims)} claim(s), '
             f'{len(package.figures)} figure(s), '
             f'{len(package.datasets)} dataset(s), '
             f'{len(package.methods)} method(s), '
             f'{len(package.code_artifacts)} code artifact(s), '
             f'{len(package.assumptions)} assumption(s), '
             f'{len(package.related_work)} related-work object(s), '
             f'{len(package.operations)} operation recipe(s), '
             f'and {len(package.edges)} edge(s).'),
            None,
        ),)


def _all_objects(package: SCPPackage) -> list[PackageObject]:
    objects: list[PackageObject] = [package.study]
    for collection in package.typed_collections().values():
        objects.extend(collection)
    return objects


def _status_field_names(package_object: PackageObject) -> list[str]:
    names: list[str] = []
    for field_info in fields(package_object):
        if field_info.name in {
                'evidence_status',
                'conversion_status',
                'reproduction_status',
        }:
            names.append(field_info.name)
    return names


def _is_uncertain(value: Any) -> bool:
    if isinstance(value, list):
        return any(_is_uncertain(item) for item in value)
    if isinstance(value, dict):
        return any(_is_uncertain(item) for item in value.values())
    return str(value) in UNCERTAIN_STATUSES


def _file_for_object(package_object: PackageObject) -> str:
    class_name = package_object.__class__.__name__
    return {
        'Study': MANIFEST_FILENAME,
        'PaperSection': PAPER_FILENAME,
        'Claim': 'claims.yaml',
        'Figure': 'figures.yaml',
        'Dataset': 'datasets.yaml',
        'CodeArtifact': 'codebase.yaml',
        'MethodStep': 'methods.yaml',
        'Assumption': 'assumptions.yaml',
        'RelatedWork': 'related-work.yaml',
        'OperationRecipe': OPERATIONS_FILENAME,
    }[class_name]
