"""
Tests for closed predicate rules.
"""

from scicon.schema.predicates import is_allowed_edge
from scicon.schema.predicates import is_known_predicate
from scicon.schema.predicates import ObjectType
from scicon.schema.predicates import Predicate


class TestPredicateRules:
    """Tests for the closed predicate vocabulary and edge rules."""

    def test_predicate_vocabulary_is_closed(self) -> None:
        assert {predicate.value for predicate in Predicate} == {
            'supported_by',
            'generated_by',
            'uses_dataset',
            'uses_method',
            'has_assumption',
            'references_result',
            'references_artifact',
            'depends_on_related_work',
        }
        assert is_known_predicate('supported_by')
        assert not is_known_predicate('free_text_link')

    def test_predicate_type_rules_accept_legal_edges(self) -> None:
        assert is_allowed_edge(
            predicate='supported_by',
            subject_type=ObjectType.CLAIM,
            object_type=ObjectType.FIGURE,
        )
        assert is_allowed_edge(
            predicate='generated_by',
            subject_type=ObjectType.FIGURE,
            object_type=ObjectType.CODE_ARTIFACT,
        )

    def test_predicate_type_rules_reject_illegal_edges(self) -> None:
        assert not is_allowed_edge(
            predicate='generated_by',
            subject_type=ObjectType.CLAIM,
            object_type=ObjectType.DATASET,
        )
