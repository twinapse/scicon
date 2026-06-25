"""
Frozen dataclasses for SCP package objects.
"""

from dataclasses import asdict
from dataclasses import dataclass
from dataclasses import field
from enum import Enum
from typing import Any

from scicon.schema.predicates import ObjectType
from scicon.schema.status import Confidence
from scicon.schema.status import EvidenceStatus

__all__ = [
    'Assumption',
    'CodeArtifact',
    'Dataset',
    'Edge',
    'Figure',
    'MethodStep',
    'OperationRecipe',
    'PackageObject',
    'PaperSection',
    'RelatedWork',
    'SCPPackage',
    'Study',
    'to_plain',
]

StatusValue = EvidenceStatus | str
ConfidenceValue = Confidence | str


@dataclass(frozen=True)
class Study:
    """
    Study-level package manifest.
    """

    id: str
    title: str
    authors: list[str] = field(default_factory=list)
    summary: str = 'missing'
    paper: str = 'missing'
    repository: str = 'missing'
    data_sources: list[str] = field(default_factory=list)
    schema_version: str = 'missing'
    conversion_status: StatusValue = EvidenceStatus.MISSING
    supplementary_materials: list[str] = field(default_factory=list)
    software_environment: Any = None
    licenses: list[str] = field(default_factory=list)
    persistent_identifiers: dict[str, Any] = field(default_factory=dict)
    maintainers: list[str] = field(default_factory=list)
    object_version: str | None = None
    related_work: list[str] = field(default_factory=list)
    packaging_status: str | None = None


@dataclass(frozen=True)
class PaperSection:
    """
    Paper section object.
    """

    id: str
    title: str = 'missing'
    type: str = 'missing'
    source_location: str | None = None
    related_claims: list[str] = field(default_factory=list)
    related_figures: list[str] = field(default_factory=list)
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class Claim:
    """
    Scientific claim object.
    """

    id: str
    text: str = 'missing'
    section: str = 'missing'
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class Figure:
    """
    Figure or panel object.
    """

    id: str
    caption: str = 'missing'
    panels: list[Any] = field(default_factory=list)
    reproduction_status: StatusValue = EvidenceStatus.MISSING
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class Dataset:
    """
    Dataset object.
    """

    id: str
    name: str = 'missing'
    description: str = 'missing'
    type: str = 'missing'
    location: str = 'missing'
    download_instructions: str | None = None
    usage_notes: list[str] = field(default_factory=list)
    variables: dict[str, Any] | list[Any] = field(default_factory=dict)
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class CodeArtifact:
    """
    Code artifact object.
    """

    id: str
    path: str = 'missing'
    purpose: str = 'missing'
    inputs: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)
    role: str = 'missing'
    status: str = 'missing'
    execution_instructions: str | None = None
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class MethodStep:
    """
    Method or preprocessing step object.
    """

    id: str
    description: str = 'missing'
    inputs: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)
    parameters: list[Any] | dict[str, Any] = field(default_factory=list)
    script: str = 'missing'
    quality_checks: list[str] = field(default_factory=list)
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class Assumption:
    """
    Assumption, limitation, or caveat object.
    """

    id: str
    description: str = 'missing'
    severity: str = 'missing'
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class RelatedWork:
    """
    Related-work context object.
    """

    id: str
    citation: str = 'missing'
    identifier: str = 'missing'
    relationship: str = 'missing'
    differences: str = 'missing'
    evidence_status: StatusValue = EvidenceStatus.MISSING


@dataclass(frozen=True)
class OperationRecipe:
    """
    Descriptive operation recipe.
    """

    id: str
    name: str = 'missing'
    purpose: str = 'missing'
    inputs: list[str] = field(default_factory=list)
    outputs: list[str] = field(default_factory=list)
    steps: list[str] = field(default_factory=list)
    commands: list[str] = field(default_factory=list)
    safety_level: str = 'read_only'
    known_caveats: list[str] = field(default_factory=list)
    execution_supported: bool = False


@dataclass(frozen=True)
class Edge:
    """
    Typed provenance edge.
    """

    id: str
    subject: str
    predicate: str
    object: str
    evidence_status: StatusValue = EvidenceStatus.MISSING
    confidence: ConfidenceValue = Confidence.LOW
    source_artifacts: list[str] = field(default_factory=list)
    source_locations: list[str] = field(default_factory=list)
    extraction_methods: list[str] = field(default_factory=list)
    author_confirmation_needed: bool = False


PackageObject = (Study | PaperSection | Claim | Figure | Dataset | CodeArtifact |
                 MethodStep | Assumption | RelatedWork | OperationRecipe)


@dataclass(frozen=True)
class SCPPackage:
    """
    Loaded package container with convenience indexes.
    """

    root: str
    study: Study
    paper_sections: list[PaperSection] = field(default_factory=list)
    claims: list[Claim] = field(default_factory=list)
    figures: list[Figure] = field(default_factory=list)
    datasets: list[Dataset] = field(default_factory=list)
    code_artifacts: list[CodeArtifact] = field(default_factory=list)
    methods: list[MethodStep] = field(default_factory=list)
    assumptions: list[Assumption] = field(default_factory=list)
    related_work: list[RelatedWork] = field(default_factory=list)
    operations: list[OperationRecipe] = field(default_factory=list)
    edges: list[Edge] = field(default_factory=list)
    _id_index: dict[str, PackageObject] = field(
        init=False,
        repr=False,
        compare=False,
    )
    _type_index: dict[str, ObjectType] = field(
        init=False,
        repr=False,
        compare=False,
    )

    def __post_init__(self) -> None:
        """
        Build object and type indexes after initialization.
        """
        id_index: dict[str, PackageObject] = {self.study.id: self.study}
        type_index: dict[str, ObjectType] = {self.study.id: ObjectType.STUDY}
        for object_type, objects in self.typed_collections().items():
            for package_object in objects:
                id_index[package_object.id] = package_object
                type_index[package_object.id] = object_type
        object.__setattr__(self, '_id_index', id_index)
        object.__setattr__(self, '_type_index', type_index)

    def typed_collections(self) -> dict[ObjectType, list[PackageObject]]:
        """
        Return object collections keyed by package object type.

        Returns:
            dict[ObjectType, list[PackageObject]]: Package objects by type.
        """
        return {
            ObjectType.PAPER_SECTION: list(self.paper_sections),
            ObjectType.CLAIM: list(self.claims),
            ObjectType.FIGURE: list(self.figures),
            ObjectType.DATASET: list(self.datasets),
            ObjectType.CODE_ARTIFACT: list(self.code_artifacts),
            ObjectType.METHOD: list(self.methods),
            ObjectType.ASSUMPTION: list(self.assumptions),
            ObjectType.RELATED_WORK: list(self.related_work),
            ObjectType.OPERATION: list(self.operations),
        }

    @property
    def id_index(self) -> dict[str, PackageObject]:
        """
        Return the object ID index.

        Returns:
            dict[str, PackageObject]: Package objects by ID.
        """
        return dict(self._id_index)

    @property
    def type_index(self) -> dict[str, ObjectType]:
        """
        Return the object type index.

        Returns:
            dict[str, ObjectType]: Object types by ID.
        """
        return dict(self._type_index)

    def get_object(self, object_id: str) -> PackageObject | None:
        """
        Return an object by ID.

        Args:
            object_id (str): Package object ID.

        Returns:
            PackageObject | None: Matching package object, when present.
        """
        return self._id_index.get(object_id)

    def get_object_type(self, object_id: str) -> ObjectType | None:
        """
        Return an object's package type.

        Args:
            object_id (str): Package object ID.

        Returns:
            ObjectType | None: Matching object type, when present.
        """
        return self._type_index.get(object_id)

    def edges_for(
        self,
        object_id: str,
        *,
        predicate: str | None = None,
        direction: str = 'both',
    ) -> list[Edge]:
        """
        Return edges linked to an object.

        Args:
            object_id (str): Package object ID.
            predicate (str | None): Optional predicate filter.
            direction (str): One of ``subject``, ``object``, or ``both``.

        Returns:
            list[Edge]: Matching provenance edges.
        """
        matches: list[Edge] = []
        for edge in self.edges:
            if predicate is not None and edge.predicate != predicate:
                continue
            subject_match = edge.subject == object_id
            object_match = edge.object == object_id
            if direction == 'subject' and subject_match:
                matches.append(edge)
            elif direction == 'object' and object_match:
                matches.append(edge)
            elif direction == 'both' and (subject_match or object_match):
                matches.append(edge)
        return matches


def to_plain(value: Any) -> Any:
    """
    Convert package dataclasses and enums into plain Python values.

    Args:
        value (Any): Value to convert.

    Returns:
        Any: JSON-serializable-ish structure suitable for MCP tool results.
    """
    if isinstance(value, Enum):
        return value.value
    if hasattr(value, '__dataclass_fields__'):
        return to_plain(asdict(value))
    if isinstance(value, dict):
        return {str(key): to_plain(item) for key, item in value.items()}
    if isinstance(value, list):
        return [to_plain(item) for item in value]
    if isinstance(value, tuple):
        return [to_plain(item) for item in value]
    return value
