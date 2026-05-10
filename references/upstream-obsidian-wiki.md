# Upstream obsidian-wiki Notes

The upstream project provides many separate skills: `llm-wiki`, `wiki-ingest`, `wiki-query`, `wiki-lint`, `wiki-status`, `wiki-dashboard`, `wiki-export`, and others. For this setup, prefer the single `obsidian-karpathy-wiki` skill because it keeps one configurable vault, dashboard, and simplified raw/wiki schema.

Useful upstream ideas preserved here:

- Raw sources are immutable source code.
- Wiki pages are compiled artifacts that evolve.
- Every ingest should extract concepts, entities, claims, relationships, and open questions.
- New information should merge with existing wiki pages instead of duplicating pages.
- Queries should use a tiered retrieval path: index first, then sections, then full pages.
- Maintenance should check broken links, orphan pages, missing frontmatter, stale pages, and tag fragmentation.
- Visualization should be refreshed after meaningful edits.

Differences in this local setup:

- Source layer is `raw/`, not upstream `_raw/` staging.
- Compiled layer is `wiki/`, not upstream category folders like `concepts/` and `entities/`.
- Dataview is installed for Obsidian tables.
- React dashboard lives in `tools/wiki-dashboard/`.
- Local REST API and full upstream skill bundle are intentionally deferred.
