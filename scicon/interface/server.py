"""
FastMCP adapter for the SCP query interface.
"""

import logging
from pathlib import Path
from typing import Any

from mcp.server.fastmcp import FastMCP

from scicon.interface.queries import codebase_resource
from scicon.interface.queries import dataset_inventory_resource
from scicon.interface.queries import explain_code_file as query_explain_code_file
from scicon.interface.queries import figure_resource
from scicon.interface.queries import find_related_objects as query_find_related_objects
from scicon.interface.queries import \
    get_dataset_description as query_get_dataset_description
from scicon.interface.queries import \
    get_figure_provenance as query_get_figure_provenance
from scicon.interface.queries import \
    get_preprocessing_chain as query_get_preprocessing_chain
from scicon.interface.queries import get_study_summary as query_get_study_summary
from scicon.interface.queries import list_assumptions as query_list_assumptions
from scicon.interface.queries import list_claims as query_list_claims
from scicon.interface.queries import paper_claims_resource
from scicon.interface.queries import paper_sections_resource
from scicon.interface.queries import provenance_resource
from scicon.interface.queries import trace_claim_to_evidence as query_trace_claim
from scicon.package.loader import load_package
from scicon.package.paths import resolve_package_dir
from scicon.validation.checks import run_validation
from scicon.validation.results import format_validation_report
from scicon.validation.results import has_errors

__all__ = [
    'build_mcp_server',
]

logger = logging.getLogger('scp')


def build_mcp_server(package_dir: str | Path | None = None) -> FastMCP:
    """
    Build a FastMCP server bound to one loaded and validated package.

    Args:
        package_dir (str | Path | None): Optional package directory override.

    Returns:
        FastMCP: Configured MCP server.

    Raises:
        RuntimeError: If package validation reports errors.
    """
    root = resolve_package_dir(package_dir)
    logger.info('Loading SCP package from %s', root)
    messages = run_validation(root)
    if has_errors(messages):
        logger.error('SCP package validation failed for %s', root)
        raise RuntimeError(
            'SCP package validation failed:\n' +
            format_validation_report(package_path=str(root), messages=messages),)
    package = load_package(root)
    logger.info(
        'Loaded SCP package %s (%d claims, %d figures, %d datasets, %d edges)',
        package.study.id,
        len(package.claims),
        len(package.figures),
        len(package.datasets),
        len(package.edges),
    )
    mcp = FastMCP('scp')

    @mcp.tool()
    def get_study_summary(study_id: str | None = None) -> dict[str, Any]:
        """
        Return the study manifest.
        """
        return query_get_study_summary(package, study_id)

    @mcp.tool()
    def list_claims(
        section: str | None = None,
        evidence_status: str | None = None,
    ) -> dict[str, Any]:
        """
        List claims with optional section or evidence-status filters.
        """
        return query_list_claims(package, section, evidence_status)

    @mcp.tool()
    def trace_claim_to_evidence(claim_id: str) -> dict[str, Any]:
        """
        Trace a claim to linked evidence objects.
        """
        return query_trace_claim(package, claim_id)

    @mcp.tool()
    def get_figure_provenance(figure_id: str) -> dict[str, Any]:
        """
        Return a figure and its provenance links.
        """
        return query_get_figure_provenance(package, figure_id)

    @mcp.tool()
    def get_dataset_description(
        dataset_id: str,
        include_usage_notes: bool = True,
    ) -> dict[str, Any]:
        """
        Return a dataset description.
        """
        return query_get_dataset_description(package, dataset_id, include_usage_notes)

    @mcp.tool()
    def get_preprocessing_chain(object_id: str) -> dict[str, Any]:
        """
        Return method/preprocessing steps for an object.
        """
        return query_get_preprocessing_chain(package, object_id)

    @mcp.tool()
    def explain_code_file(code_id_or_path: str) -> dict[str, Any]:
        """
        Return a code artifact by ID or package path.
        """
        return query_explain_code_file(package, code_id_or_path)

    @mcp.tool()
    def list_assumptions(
        object_id: str | None = None,
        severity: str | None = None,
    ) -> dict[str, Any]:
        """
        List assumptions by optional object or severity filter.
        """
        return query_list_assumptions(package, object_id, severity)

    @mcp.tool()
    def find_related_objects(
        object_id: str,
        predicate: str | None = None,
    ) -> dict[str, Any]:
        """
        Return provenance neighbors for an object.
        """
        return query_find_related_objects(package, object_id, predicate)

    @mcp.resource('paper://sections')
    def paper_sections() -> dict[str, Any]:
        """
        Return paper sections.
        """
        return paper_sections_resource(package)

    @mcp.resource('paper://claims')
    def paper_claims() -> dict[str, Any]:
        """
        Return paper claims.
        """
        return paper_claims_resource(package)

    @mcp.resource('figures://{figure_id}')
    def figure(figure_id: str) -> dict[str, Any]:
        """
        Return figure provenance.
        """
        return figure_resource(package, figure_id)

    @mcp.resource('datasets://inventory')
    def dataset_inventory() -> dict[str, Any]:
        """
        Return dataset inventory.
        """
        return dataset_inventory_resource(package)

    @mcp.resource('codebase://map')
    def codebase() -> dict[str, Any]:
        """
        Return codebase map.
        """
        return codebase_resource(package)

    @mcp.resource('provenance://{object_id}')
    def provenance(object_id: str) -> dict[str, Any]:
        """
        Return provenance for an object.
        """
        return provenance_resource(package, object_id)

    return mcp
