"""
Integration tests for pure query functions.
"""

from scicon.interface.queries import codebase_resource
from scicon.interface.queries import dataset_inventory_resource
from scicon.interface.queries import explain_code_file
from scicon.interface.queries import figure_resource
from scicon.interface.queries import find_related_objects
from scicon.interface.queries import get_dataset_description
from scicon.interface.queries import get_figure_provenance
from scicon.interface.queries import get_preprocessing_chain
from scicon.interface.queries import get_study_summary
from scicon.interface.queries import list_assumptions
from scicon.interface.queries import list_claims
from scicon.interface.queries import paper_claims_resource
from scicon.interface.queries import paper_sections_resource
from scicon.interface.queries import provenance_resource
from scicon.interface.queries import trace_claim_to_evidence
from scicon.schema.objects import SCPPackage


class TestQueryFunctions:
    """Tests for pure query helpers."""

    def test_tools_preserve_statuses_and_citations(
        self,
        example_package: SCPPackage,
    ) -> None:
        summary = get_study_summary(example_package)
        assert summary['status'] == 'ok'
        assert summary['result']['study']['conversion_status'] == 'author_confirmed'
        assert summary['citations'] == ['manifest.yaml']

        claims = list_claims(example_package)
        assert claims['result']['claims'][0]['evidence_status'] == 'explicit'

        trace = trace_claim_to_evidence(example_package, 'claim_calibration_shift')
        assert trace['status'] == 'ok'
        assert {link['edge']['evidence_status'] for link in trace['result']['links']
               } >= {'explicit', 'unresolved'}
        assert 'provenance.yaml' in trace['citations']

        figure = get_figure_provenance(example_package, 'fig_3')
        assert figure['result']['figure']['reproduction_status'] == 'ambiguous'

        dataset = get_dataset_description(
            example_package,
            'calibration_eval_metrics',
        )
        assert dataset['result']['dataset']['download_instructions'] == 'missing'

        methods = get_preprocessing_chain(example_package, 'fig_3')
        assert methods['result']['methods'][0]['related_object']['id'] == (
            'temporal_recalibration_eval')

        code = explain_code_file(example_package, 'scripts/build_figure3.py')
        assert code['result']['code_artifact']['id'] == 'build_figure3'

        assumptions = list_assumptions(example_package, 'claim_calibration_shift')
        assert assumptions['result']['assumptions'][0]['evidence_status'] == (
            'unresolved')

        related = find_related_objects(
            example_package,
            'temporal_recalibration_eval',
            'depends_on_related_work',
        )
        assert related['result']['links'][0]['related_object_type'] == 'related_work'

    def test_unknown_ids_return_not_enough_information(
        self,
        example_package: SCPPackage,
    ) -> None:
        result = trace_claim_to_evidence(example_package, 'unknown_claim')
        assert result['status'] == 'not_enough_information'
        assert result['object_id'] == 'unknown_claim'
        assert 'claims.yaml' in result['citations']

    def test_resource_helpers_return_package_payloads(
        self,
        example_package: SCPPackage,
    ) -> None:
        assert paper_sections_resource(example_package)['result']['sections']
        assert paper_claims_resource(example_package)['result']['claims']
        assert figure_resource(example_package,
                               'fig_3')['result']['figure']['id'] == 'fig_3'
        assert dataset_inventory_resource(example_package)['result']['datasets']
        assert codebase_resource(example_package)['result']['code_artifacts']
        assert provenance_resource(
            example_package,
            'claim_calibration_shift',
        )['result']['links']
