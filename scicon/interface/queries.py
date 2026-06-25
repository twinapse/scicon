"""
Pure query functions for loaded SCP packages.
"""

from collections.abc import Iterable
from typing import Any

from scicon.schema.objects import CodeArtifact
from scicon.schema.objects import Edge
from scicon.schema.objects import SCPPackage
from scicon.schema.objects import to_plain

__all__ = [
    'codebase_resource',
    'dataset_inventory_resource',
    'explain_code_file',
    'figure_resource',
    'find_related_objects',
    'get_dataset_description',
    'get_figure_provenance',
    'get_preprocessing_chain',
    'get_study_summary',
    'list_assumptions',
    'list_claims',
    'paper_claims_resource',
    'paper_sections_resource',
    'provenance_resource',
    'trace_claim_to_evidence',
]

NOT_ENOUGH_INFORMATION = 'not_enough_information'
OK = 'ok'


def get_study_summary(
    package: SCPPackage,
    study_id: str | None = None,
) -> dict[str, Any]:
    """
    Return the study manifest.

    Args:
        package (SCPPackage): Loaded package.
        study_id (str | None): Optional study ID check.

    Returns:
        dict[str, Any]: Structured query result.
    """
    if study_id is not None and study_id != package.study.id:
        return _not_enough(
            object_id=study_id,
            message='The requested study is not present in this package.',
            citations=['manifest.yaml'],
        )
    return _ok(
        result={'study': to_plain(package.study)},
        citations=['manifest.yaml'],
    )


def list_claims(
    package: SCPPackage,
    section: str | None = None,
    evidence_status: str | None = None,
) -> dict[str, Any]:
    """
    List claims with optional filters.

    Args:
        package (SCPPackage): Loaded package.
        section (str | None): Optional section filter.
        evidence_status (str | None): Optional status filter.

    Returns:
        dict[str, Any]: Structured query result.
    """
    claims = package.claims
    if section is not None:
        claims = [claim for claim in claims if claim.section == section]
    if evidence_status is not None:
        claims = [
            claim for claim in claims if str(claim.evidence_status) == evidence_status
        ]
    if not claims:
        return _not_enough(
            object_id=section or evidence_status,
            message='No claims matched the requested filters.',
            citations=['claims.yaml'],
        )
    return _ok(
        result={'claims': to_plain(claims)},
        citations=['claims.yaml', 'paper.yaml'],
    )


def trace_claim_to_evidence(
    package: SCPPackage,
    claim_id: str,
) -> dict[str, Any]:
    """
    Trace a claim to linked evidence objects.

    Args:
        package (SCPPackage): Loaded package.
        claim_id (str): Claim object ID.

    Returns:
        dict[str, Any]: Structured query result.
    """
    claim = package.get_object(claim_id)
    if claim is None:
        return _not_enough(
            object_id=claim_id,
            message='The requested claim is not present in this package.',
            citations=['claims.yaml', 'provenance.yaml'],
        )
    linked_edges = package.edges_for(claim_id, direction='subject')
    if not linked_edges:
        return _not_enough(
            object_id=claim_id,
            message='The package contains the claim but no outgoing evidence links.',
            citations=['claims.yaml', 'provenance.yaml'],
            result={'claim': to_plain(claim)},
        )
    return _ok(
        result={
            'claim': to_plain(claim),
            'links': _edge_links(package, linked_edges, target_side='object'),
        },
        citations=_citations(['claims.yaml', 'provenance.yaml'], linked_edges),
    )


def get_figure_provenance(
    package: SCPPackage,
    figure_id: str,
) -> dict[str, Any]:
    """
    Return a figure and its provenance links.

    Args:
        package (SCPPackage): Loaded package.
        figure_id (str): Figure object ID.

    Returns:
        dict[str, Any]: Structured query result.
    """
    figure = package.get_object(figure_id)
    if figure is None:
        return _not_enough(
            object_id=figure_id,
            message='The requested figure is not present in this package.',
            citations=['figures.yaml', 'provenance.yaml'],
        )
    linked_edges = package.edges_for(figure_id, direction='subject')
    if not linked_edges:
        return _not_enough(
            object_id=figure_id,
            message='The package contains the figure but no provenance links.',
            citations=['figures.yaml', 'provenance.yaml'],
            result={'figure': to_plain(figure)},
        )
    return _ok(
        result={
            'figure': to_plain(figure),
            'provenance': _edge_links(package, linked_edges, target_side='object'),
        },
        citations=_citations(['figures.yaml', 'provenance.yaml'], linked_edges),
    )


def get_dataset_description(
    package: SCPPackage,
    dataset_id: str,
    include_usage_notes: bool = True,
) -> dict[str, Any]:
    """
    Return a dataset description.

    Args:
        package (SCPPackage): Loaded package.
        dataset_id (str): Dataset object ID.
        include_usage_notes (bool): Whether to include usage notes.

    Returns:
        dict[str, Any]: Structured query result.
    """
    dataset = package.get_object(dataset_id)
    if dataset is None:
        return _not_enough(
            object_id=dataset_id,
            message='The requested dataset is not present in this package.',
            citations=['datasets.yaml'],
        )
    dataset_data = to_plain(dataset)
    if not include_usage_notes:
        dataset_data.pop('usage_notes', None)
    return _ok(
        result={'dataset': dataset_data},
        citations=['datasets.yaml'],
    )


def get_preprocessing_chain(
    package: SCPPackage,
    object_id: str,
) -> dict[str, Any]:
    """
    Return method/preprocessing steps for a method, claim, or figure.

    Args:
        package (SCPPackage): Loaded package.
        object_id (str): Method, claim, or figure object ID.

    Returns:
        dict[str, Any]: Structured query result.
    """
    package_object = package.get_object(object_id)
    if package_object is None:
        return _not_enough(
            object_id=object_id,
            message='The requested object is not present in this package.',
            citations=['methods.yaml', 'provenance.yaml'],
        )
    if _object_type_name(package, object_id) == 'method':
        return _ok(
            result={'methods': [to_plain(package_object)]},
            citations=['methods.yaml'],
        )
    linked_edges = [
        edge for edge in package.edges_for(object_id, direction='subject')
        if edge.predicate in {'uses_method', 'supported_by'} and
        _object_type_name(package, edge.object) == 'method'
    ]
    if not linked_edges:
        return _not_enough(
            object_id=object_id,
            message='No method or preprocessing chain is linked to this object.',
            citations=['methods.yaml', 'provenance.yaml'],
            result={'object': to_plain(package_object)},
        )
    return _ok(
        result={
            'object': to_plain(package_object),
            'methods': _edge_links(package, linked_edges, target_side='object'),
        },
        citations=_citations(['methods.yaml', 'provenance.yaml'], linked_edges),
    )


def explain_code_file(
    package: SCPPackage,
    code_id_or_path: str,
) -> dict[str, Any]:
    """
    Return a code artifact by ID or package path.

    Args:
        package (SCPPackage): Loaded package.
        code_id_or_path (str): Code artifact ID or path.

    Returns:
        dict[str, Any]: Structured query result.
    """
    artifact = package.get_object(code_id_or_path)
    if artifact is None:
        artifact = _code_by_path(package.code_artifacts, code_id_or_path)
    if artifact is None:
        return _not_enough(
            object_id=code_id_or_path,
            message='The requested code artifact is not present in this package.',
            citations=['codebase.yaml'],
        )
    return _ok(
        result={'code_artifact': to_plain(artifact)},
        citations=['codebase.yaml'],
    )


def list_assumptions(
    package: SCPPackage,
    object_id: str | None = None,
    severity: str | None = None,
) -> dict[str, Any]:
    """
    List assumptions, optionally linked to one object or severity.

    Args:
        package (SCPPackage): Loaded package.
        object_id (str | None): Optional subject object ID.
        severity (str | None): Optional severity filter.

    Returns:
        dict[str, Any]: Structured query result.
    """
    assumptions = package.assumptions
    linked_edges: list[Edge] = []
    if object_id is not None:
        linked_edges = [
            edge for edge in package.edges_for(object_id, predicate='has_assumption')
            if edge.subject == object_id
        ]
        assumption_ids = {edge.object for edge in linked_edges}
        assumptions = [
            assumption for assumption in assumptions if assumption.id in assumption_ids
        ]
    if severity is not None:
        assumptions = [
            assumption for assumption in assumptions if assumption.severity == severity
        ]
    if not assumptions:
        return _not_enough(
            object_id=object_id or severity,
            message='No assumptions matched the requested filters.',
            citations=['assumptions.yaml', 'provenance.yaml'],
        )
    return _ok(
        result={
            'assumptions': to_plain(assumptions),
            'links': to_plain(linked_edges),
        },
        citations=_citations(['assumptions.yaml', 'provenance.yaml'], linked_edges),
    )


def find_related_objects(
    package: SCPPackage,
    object_id: str,
    predicate: str | None = None,
) -> dict[str, Any]:
    """
    Return provenance neighbors for an object.

    Args:
        package (SCPPackage): Loaded package.
        object_id (str): Package object ID.
        predicate (str | None): Optional predicate filter.

    Returns:
        dict[str, Any]: Structured query result.
    """
    package_object = package.get_object(object_id)
    if package_object is None:
        return _not_enough(
            object_id=object_id,
            message='The requested object is not present in this package.',
            citations=['provenance.yaml'],
        )
    edges = package.edges_for(object_id, predicate=predicate)
    if not edges:
        return _not_enough(
            object_id=object_id,
            message='No related objects are linked with the requested predicate.',
            citations=['provenance.yaml'],
            result={'object': to_plain(package_object)},
        )
    return _ok(
        result={
            'object': to_plain(package_object),
            'links': _edge_links(package, edges),
        },
        citations=_citations(['provenance.yaml'], edges),
    )


def paper_sections_resource(package: SCPPackage) -> dict[str, Any]:
    """
    Return paper sections as a resource payload.
    """
    return _ok(
        result={'sections': to_plain(package.paper_sections)},
        citations=['paper.yaml'],
    )


def paper_claims_resource(package: SCPPackage) -> dict[str, Any]:
    """
    Return paper claims as a resource payload.
    """
    return list_claims(package)


def figure_resource(
    package: SCPPackage,
    figure_id: str,
) -> dict[str, Any]:
    """
    Return one figure as a resource payload.
    """
    return get_figure_provenance(package, figure_id)


def dataset_inventory_resource(package: SCPPackage) -> dict[str, Any]:
    """
    Return dataset inventory as a resource payload.
    """
    return _ok(
        result={'datasets': to_plain(package.datasets)},
        citations=['datasets.yaml'],
    )


def codebase_resource(package: SCPPackage) -> dict[str, Any]:
    """
    Return codebase map as a resource payload.
    """
    return _ok(
        result={'code_artifacts': to_plain(package.code_artifacts)},
        citations=['codebase.yaml'],
    )


def provenance_resource(
    package: SCPPackage,
    object_id: str,
) -> dict[str, Any]:
    """
    Return provenance links for an object as a resource payload.
    """
    return find_related_objects(package, object_id)


def _ok(
    *,
    result: dict[str, Any],
    citations: list[str],
) -> dict[str, Any]:
    return {
        'status': OK,
        'message': None,
        'result': result,
        'citations': sorted(set(citations)),
    }


def _not_enough(
    *,
    object_id: str | None,
    message: str,
    citations: list[str],
    result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        'status': NOT_ENOUGH_INFORMATION,
        'object_id': object_id,
        'message': message,
        'result': result or {},
        'citations': sorted(set(citations)),
    }


def _edge_links(
    package: SCPPackage,
    edges: Iterable[Edge],
    *,
    target_side: str | None = None,
) -> list[dict[str, Any]]:
    links: list[dict[str, Any]] = []
    for edge in edges:
        if target_side == 'object':
            related_id = edge.object
        elif target_side == 'subject':
            related_id = edge.subject
        else:
            related_id = edge.object if package.get_object(
                edge.object) else edge.subject
        related_object = package.get_object(related_id)
        links.append(
            {
                'edge': to_plain(edge),
                'related_object': to_plain(related_object),
                'related_object_type': _object_type_name(package, related_id),
            },)
    return links


def _citations(base: list[str], edges: Iterable[Edge]) -> list[str]:
    values = list(base)
    for edge in edges:
        values.extend(edge.source_artifacts)
    return sorted(set(values))


def _object_type_name(
    package: SCPPackage,
    object_id: str,
) -> str | None:
    object_type = package.get_object_type(object_id)
    if object_type is None:
        return None
    return object_type.value


def _code_by_path(
    code_artifacts: list[CodeArtifact],
    path: str,
) -> CodeArtifact | None:
    for artifact in code_artifacts:
        if artifact.path == path:
            return artifact
    return None
