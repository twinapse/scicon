"""
Validation result types.
"""

from dataclasses import dataclass
from enum import StrEnum

__all__ = [
    'Severity',
    'ValidationMessage',
    'format_validation_report',
    'has_errors',
]


class Severity(StrEnum):
    """
    Validation severity levels.
    """

    ERROR = 'error'
    WARNING = 'warning'
    INFO = 'info'


@dataclass(frozen=True)
class ValidationMessage:
    """
    Single validation finding.
    """

    severity: Severity
    file: str
    object_id: str | None
    field: str | None
    message: str
    suggested_fix: str | None = None

    def format(self) -> str:
        """
        Format a validation message for CLI output.

        Returns:
            str: Human-readable one-line validation finding.
        """
        location = self.file
        if self.object_id:
            location = f'{location}:{self.object_id}'
        if self.field:
            location = f'{location}.{self.field}'
        if self.suggested_fix:
            return (f'[{self.severity.value}] {location}: {self.message} '
                    f'Fix: {self.suggested_fix}')
        return f'[{self.severity.value}] {location}: {self.message}'


def has_errors(messages: list[ValidationMessage]) -> bool:
    """
    Return whether any validation message is an error.

    Args:
        messages (list[ValidationMessage]): Validation findings.

    Returns:
        bool: True when errors are present.
    """
    return any(message.severity == Severity.ERROR for message in messages)


def format_validation_report(
    *,
    package_path: str,
    messages: list[ValidationMessage],
) -> str:
    """
    Format a validation report.

    Args:
        package_path (str): Package root path.
        messages (list[ValidationMessage]): Validation findings.

    Returns:
        str: Human-readable report.
    """
    counts = {
        Severity.ERROR: 0,
        Severity.WARNING: 0,
        Severity.INFO: 0,
    }
    for message in messages:
        counts[message.severity] += 1
    lines = [
        f'Package path: {package_path}',
        ('Messages: '
         f'{counts[Severity.ERROR]} error(s), '
         f'{counts[Severity.WARNING]} warning(s), '
         f'{counts[Severity.INFO]} info message(s)'),
    ]
    lines.extend(message.format() for message in messages)
    return '\n'.join(lines)
