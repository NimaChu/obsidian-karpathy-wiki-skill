# Obsidian Karpathy Wiki Skill

Cross-agent skill for managing a local Obsidian-first Karpathy-style LLM wiki.

Works with:

- Codex
- Claude Code
- OpenClaw

Default vault: `~/Documents/knowledge`

Override with:

```bash
export KARPATHY_OBSIDIAN_VAULT="/path/to/your/vault"
```

## Install

Clone this repository into your agent's skills directory.

Codex:

```bash
git clone https://github.com/NimaChu/obsidian-karpathy-wiki-skill.git ~/.codex/skills/obsidian-karpathy-wiki
```

Claude Code:

```bash
git clone https://github.com/NimaChu/obsidian-karpathy-wiki-skill.git ~/.claude/skills/obsidian-karpathy-wiki
```

OpenClaw:

```bash
git clone https://github.com/NimaChu/obsidian-karpathy-wiki-skill.git ~/.openclaw/workspace/projects/skills/obsidian-karpathy-wiki
```

If your OpenClaw setup uses a different skills directory, clone it there. OpenClaw only needs the `SKILL.md` entry point.

## Commands

Run from the skill directory:

```bash
node scripts/karpathy-wiki.mjs status
node scripts/karpathy-wiki.mjs lint
node scripts/karpathy-wiki.mjs garden
node scripts/karpathy-wiki.mjs repair-links
node scripts/karpathy-wiki.mjs search "query"
node scripts/karpathy-wiki.mjs distill-query --title "New topic" --summary-file /path/to/summary.md --source "[[raw/source]]"
node scripts/karpathy-wiki.mjs dashboard
node scripts/karpathy-wiki.mjs build-dashboard
```

Capture a source note:

```bash
node scripts/karpathy-wiki.mjs capture --title "Source title" --url "https://example.com" --type webpage
```

`capture` defaults to:

- source snapshotting into `raw/snapshots/`
- remote image mirroring when the Markdown capture contains inline image URLs
- raw metadata fields such as `snapshot_path`, `content_hash`, `capture_method`, and `source_quality`
- dashboard refresh after ingest

Use `--no-snapshot` or `--no-mirror-images` only when intentionally needed.

## Vault Contract

The vault should contain:

```text
raw/
wiki/
templates/
tools/wiki-dashboard/
AGENTS.md
```

`raw/` preserves evidence. `wiki/` contains synthesized pages. Obsidian remains the main reading/editing/navigation surface through links, backlinks, graph, Properties, Templates, Bases, and Dataview.

The dashboard is a read-only enhancement layer for:

- intake queues and health review
- unresolved link triage
- typed relation inspection
- enhanced cross-layer search
- HTML-style raw reading with inline image order preserved

It is not a second Obsidian and it is not the source of truth.

## Processed Gate

Do not mark a raw source `processed` unless:

- it has at least one durable wiki target in `related`
- the linked wiki page points back to the raw note
- obvious follow-up flags are cleared
- key related links are resolved

Otherwise keep it in `inbox` or `needs-followup`.
