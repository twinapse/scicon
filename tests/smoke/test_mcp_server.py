"""
Smoke tests for FastMCP server construction and invocation.
"""

import asyncio
import json
from pathlib import Path
from typing import Any

import pytest


class TestMCPServer:
    """Smoke tests for FastMCP server behavior."""

    def test_mcp_server_lists_and_invokes_entries(
        self,
        example_package_path: Path,
    ) -> None:
        server_module = pytest.importorskip('scicon.interface.server')

        async def exercise_server() -> None:
            server = server_module.build_mcp_server(example_package_path)

            tools = await server.list_tools()
            tool_names = {tool.name for tool in tools}
            assert {
                'get_study_summary',
                'list_claims',
                'trace_claim_to_evidence',
                'get_figure_provenance',
                'get_dataset_description',
                'get_preprocessing_chain',
                'explain_code_file',
                'list_assumptions',
                'find_related_objects',
            } == tool_names

            content, structured = await server.call_tool(
                'trace_claim_to_evidence',
                {'claim_id': 'claim_calibration_shift'},
            )
            assert structured['status'] == 'ok'
            assert structured['result']['claim']['evidence_status'] == 'explicit'
            assert json.loads(content[0].text)['status'] == 'ok'

            resources = await server.list_resources()
            resource_uris = {str(resource.uri) for resource in resources}
            assert {
                'paper://sections',
                'paper://claims',
                'datasets://inventory',
                'codebase://map',
            } <= resource_uris

            templates = await server.list_resource_templates()
            template_uris = {_template_uri(template) for template in templates}
            assert {
                'figures://{figure_id}',
                'provenance://{object_id}',
            } == template_uris

            sections = await server.read_resource('paper://sections')
            assert json.loads(sections[0].content)['result']['sections'][0]['id'] == (
                'results_excerpt')

            datasets = await server.read_resource('datasets://inventory')
            assert json.loads(datasets[0].content)['result']['datasets']

            figure = await server.read_resource('figures://fig_3')
            assert json.loads(figure[0].content)['result']['figure']['id'] == 'fig_3'

        asyncio.run(exercise_server())


def _template_uri(template: Any) -> str:
    if hasattr(template, 'uriTemplate'):
        return str(template.uriTemplate)
    return str(template.uri_template)
