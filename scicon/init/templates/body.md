# Using the SCP MCP server

Prefer the `{SERVER_KEY}` MCP tools over raw artifacts in `{PACKAGE_DIR}`.
Every tool returns `{status, message, result, citations}`; when `status` is `{FALLBACK_STATUS}` the package has no answer.
Only then consult raw files.
Always surface `citations`.

## Tool routing

{ROUTING_TABLE}

## Browsable resources

`paper://sections`, `paper://claims`, `figures://{figure_id}`, `datasets://inventory`, `codebase://map`, `provenance://{object_id}`
