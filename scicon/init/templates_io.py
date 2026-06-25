"""
Template loading and rendering for `scicon init`.
"""

from importlib.resources import files

from scicon.interface.queries import NOT_ENOUGH_INFORMATION

__all__ = [
    'ROUTING_TABLE',
    'render_policy',
    'render_template',
]

ROUTING_TABLE: tuple[tuple[str, str], ...] = (
    ('study overview / manifest / authors / summary', 'get_study_summary'),
    (
        'what the paper claims (optionally by section or evidence status)',
        'list_claims',
    ),
    ('the evidence behind a specific claim', 'trace_claim_to_evidence'),
    (
        'how a figure was produced (data / code / method)',
        'get_figure_provenance',
    ),
    ("a dataset's contents / variables / usage notes", 'get_dataset_description'),
    (
        'the preprocessing / method steps for an object',
        'get_preprocessing_chain',
    ),
    ('what a code file / artifact does', 'explain_code_file'),
    ('assumptions / caveats / limitations', 'list_assumptions'),
    (
        'what is related / linked to an object (optionally by predicate)',
        'find_related_objects',
    ),
)


def render_policy(*, package_dir: str, server_key: str) -> str:
    """
    Render the always-on policy block.

    Args:
        package_dir (str): Target-repo package directory value.
        server_key (str): MCP server key.

    Returns:
        str: Rendered policy markdown.
    """
    return render_template(
        'policy.md',
        package_dir=package_dir,
        server_key=server_key,
    )


def render_template(
    template_name: str,
    *,
    package_dir: str,
    server_key: str,
) -> str:
    """
    Render a packaged `scicon init` markdown template.

    Args:
        template_name (str): Template filename under ``scicon/init/templates``.
        package_dir (str): Target-repo package directory value.
        server_key (str): MCP server key.

    Returns:
        str: Rendered markdown.
    """
    text = _load_template(template_name)
    text = text.replace('{BODY}', _load_template('body.md').strip())
    replacements = {
        'FALLBACK_STATUS': NOT_ENOUGH_INFORMATION,
        'PACKAGE_DIR': package_dir,
        'ROUTING_TABLE': _render_routing_table(),
        'SERVER_KEY': server_key,
    }
    for name, value in replacements.items():
        text = text.replace('{' + name + '}', value)
    return text.strip() + '\n'


def _load_template(template_name: str) -> str:
    template = files('scicon.init').joinpath('templates', template_name)
    return template.read_text(encoding='utf-8')


def _render_routing_table() -> str:
    lines = [
        '| If the question is about... | Use |',
        '| --- | --- |',
    ]
    for intent, tool_name in ROUTING_TABLE:
        lines.append(f'| {intent} | `{tool_name}` |')
    return '\n'.join(lines)
