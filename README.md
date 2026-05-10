# Obsidian Karpathy Wiki Skill

Cross-agent skill for managing a local Obsidian Karpathy-style LLM wiki.

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
node scripts/karpathy-wiki.mjs dashboard
node scripts/karpathy-wiki.mjs build-dashboard
```

Capture a source note:

```bash
node scripts/karpathy-wiki.mjs capture --title "Source title" --url "https://example.com" --type webpage
```

## Vault Contract

The vault should contain:

```text
raw/
wiki/
templates/
tools/wiki-dashboard/
AGENTS.md
```

`raw/` preserves evidence. `wiki/` contains synthesized pages. The dashboard reads Markdown and generated JSON; it is not the source of truth.
