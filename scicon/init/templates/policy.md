For questions about this study/package, query the `{SERVER_KEY}` MCP tools first (for example, `get_study_summary`, `list_claims`, `trace_claim_to_evidence`, `find_related_objects`) instead of reading raw papers, code, or data files.
Fall back to raw files only when a tool returns `status: "{FALLBACK_STATUS}"`.
Always surface the `citations` field returned by the tools.
See the `scp` skill/prompt for the full tool-routing table.
