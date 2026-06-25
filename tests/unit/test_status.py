"""
Tests for evidence-status and confidence vocabularies.
"""

from scicon.schema.status import Confidence
from scicon.schema.status import EvidenceStatus
from scicon.schema.status import is_known_confidence
from scicon.schema.status import is_known_status


class TestStatusVocabularies:
    """Tests for evidence status and confidence vocabularies."""

    def test_evidence_status_values_match_schema(self) -> None:
        assert {status.value for status in EvidenceStatus} == {
            'explicit',
            'extracted',
            'inferred',
            'imported',
            'author_confirmed',
            'missing',
            'ambiguous',
            'unresolved',
        }

    def test_confidence_values_match_schema(self) -> None:
        assert {confidence.value for confidence in Confidence} == {
            'high',
            'medium',
            'low',
        }

    def test_vocab_helpers_reject_unknown_values(self) -> None:
        assert is_known_status('explicit')
        assert not is_known_status('confirmed')
        assert is_known_confidence('medium')
        assert not is_known_confidence('certain')
