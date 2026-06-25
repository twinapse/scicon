"""
Closed predicate vocabulary for package provenance edges.
"""

from enum import StrEnum

__all__ = [
    'ObjectType',
    'Predicate',
    'PREDICATE_RULES',
    'is_allowed_edge',
    'is_known_predicate',
]


class ObjectType(StrEnum):
    """
    Package object types used for predicate type checks.
    """

    STUDY = 'study'
    PAPER_SECTION = 'paper_section'
    CLAIM = 'claim'
    FIGURE = 'figure'
    DATASET = 'dataset'
    CODE_ARTIFACT = 'code_artifact'
    METHOD = 'method'
    ASSUMPTION = 'assumption'
    RELATED_WORK = 'related_work'
    OPERATION = 'operation'


class Predicate(StrEnum):
    """
    Allowed provenance edge predicates.
    """

    SUPPORTED_BY = 'supported_by'
    GENERATED_BY = 'generated_by'
    USES_DATASET = 'uses_dataset'
    USES_METHOD = 'uses_method'
    HAS_ASSUMPTION = 'has_assumption'
    REFERENCES_RESULT = 'references_result'
    REFERENCES_ARTIFACT = 'references_artifact'
    DEPENDS_ON_RELATED_WORK = 'depends_on_related_work'


PREDICATE_RULES: dict[Predicate, tuple[set[ObjectType], set[ObjectType]]] = {
    Predicate.SUPPORTED_BY: (
        {ObjectType.CLAIM},
        {
            ObjectType.FIGURE,
            ObjectType.DATASET,
            ObjectType.CODE_ARTIFACT,
            ObjectType.METHOD,
        },
    ),
    Predicate.GENERATED_BY: (
        {ObjectType.FIGURE},
        {ObjectType.CODE_ARTIFACT},
    ),
    Predicate.USES_DATASET: (
        {ObjectType.FIGURE},
        {ObjectType.DATASET},
    ),
    Predicate.USES_METHOD: (
        {ObjectType.FIGURE, ObjectType.CLAIM},
        {ObjectType.METHOD},
    ),
    Predicate.HAS_ASSUMPTION: (
        {ObjectType.CLAIM, ObjectType.FIGURE, ObjectType.METHOD},
        {ObjectType.ASSUMPTION},
    ),
    Predicate.REFERENCES_RESULT: (
        {ObjectType.PAPER_SECTION},
        {ObjectType.CLAIM, ObjectType.FIGURE},
    ),
    Predicate.REFERENCES_ARTIFACT: (
        {ObjectType.STUDY, ObjectType.OPERATION},
        {ObjectType.DATASET, ObjectType.CODE_ARTIFACT, ObjectType.FIGURE},
    ),
    Predicate.DEPENDS_ON_RELATED_WORK: (
        {ObjectType.CLAIM, ObjectType.METHOD},
        {ObjectType.RELATED_WORK},
    ),
}


def is_known_predicate(value: object) -> bool:
    """
    Return whether a value belongs to the predicate vocabulary.

    Args:
        value (object): Candidate predicate value.

    Returns:
        bool: True when the value is allowed.
    """
    try:
        Predicate(str(value))
    except ValueError:
        return False
    return True


def is_allowed_edge(
    *,
    predicate: object,
    subject_type: ObjectType | str,
    object_type: ObjectType | str,
) -> bool:
    """
    Return whether the edge predicate supports the subject and object types.

    Args:
        predicate (object): Candidate predicate value.
        subject_type (ObjectType | str): Resolved subject object type.
        object_type (ObjectType | str): Resolved object object type.

    Returns:
        bool: True when the edge is legal for the closed vocabulary.
    """
    try:
        typed_predicate = Predicate(str(predicate))
        typed_subject = ObjectType(str(subject_type))
        typed_object = ObjectType(str(object_type))
    except ValueError:
        return False
    allowed_subjects, allowed_objects = PREDICATE_RULES[typed_predicate]
    return typed_subject in allowed_subjects and typed_object in allowed_objects
