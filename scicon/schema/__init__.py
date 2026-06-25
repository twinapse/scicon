"""
Schema objects and vocabularies for SCP packages.
"""

from scicon.schema.objects import Assumption
from scicon.schema.objects import CodeArtifact
from scicon.schema.objects import Dataset
from scicon.schema.objects import Edge
from scicon.schema.objects import Figure
from scicon.schema.objects import MethodStep
from scicon.schema.objects import OperationRecipe
from scicon.schema.objects import PaperSection
from scicon.schema.objects import RelatedWork
from scicon.schema.objects import SCPPackage
from scicon.schema.objects import Study
from scicon.schema.status import Confidence
from scicon.schema.status import EvidenceStatus

__all__ = [
    'Assumption',
    'CodeArtifact',
    'Confidence',
    'Dataset',
    'Edge',
    'EvidenceStatus',
    'Figure',
    'MethodStep',
    'OperationRecipe',
    'PaperSection',
    'RelatedWork',
    'SCPPackage',
    'Study',
]
