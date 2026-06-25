"""
Evidence status and confidence vocabularies.
"""

from enum import StrEnum

__all__ = [
    'Confidence',
    'EvidenceStatus',
    'is_known_confidence',
    'is_known_status',
]


class EvidenceStatus(StrEnum):
    """
    Evidence status values used on package objects and provenance edges.
    """

    EXPLICIT = 'explicit'
    EXTRACTED = 'extracted'
    INFERRED = 'inferred'
    IMPORTED = 'imported'
    AUTHOR_CONFIRMED = 'author_confirmed'
    MISSING = 'missing'
    AMBIGUOUS = 'ambiguous'
    UNRESOLVED = 'unresolved'


class Confidence(StrEnum):
    """
    Confidence values used on provenance edges.
    """

    HIGH = 'high'
    MEDIUM = 'medium'
    LOW = 'low'


def is_known_status(value: object) -> bool:
    """
    Return whether a value is an allowed evidence status.

    Args:
        value (object): Candidate status value.

    Returns:
        bool: True when the value belongs to the status vocabulary.
    """
    try:
        EvidenceStatus(str(value))
    except ValueError:
        return False
    return True


def is_known_confidence(value: object) -> bool:
    """
    Return whether a value is an allowed confidence value.

    Args:
        value (object): Candidate confidence value.

    Returns:
        bool: True when the value belongs to the confidence vocabulary.
    """
    try:
        Confidence(str(value))
    except ValueError:
        return False
    return True
