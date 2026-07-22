## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- When calling `graphify.extract.extract()` directly (e.g. during `/graphify --update` on files that all live under a subfolder like `pm4-app/`), always pass `cache_root=Path('.').resolve()` explicitly. Without it, `extract()` infers the cache root from the common path prefix of the files passed in — if every changed file is under one subfolder, it infers that subfolder as the root and creates a stray duplicate `graphify-out/` inside it instead of writing to the real one at the project root.
