---
name: spacefast-account
description: Local Spacefast connection state on this machine — a stored API key scoped to Sarthak927's Team, how to verify it, and what the setup run installed. Load before any Spacefast publish so work lands in the right team; pairs with the generic `spacefast` skill for publish mechanics.
---

# Spacefast account on this machine

Connected 2026-09-22 via a one-use team handoff from the owner. A durable API key was
redeemed and is held by the Spacefast CLI — it never touched a repo, env file, or
transcript. Keys are managed in the Spacefast dashboard.

- Team: **Sarthak927's Team** — slug `sarthak927-team`, id `qNEk0X4hl2K36Lu7WKbqBesfsdgnTXuw`.
  Publish here unless the user says otherwise.
- Handoff was team-scoped, so no Space is pre-bound. List existing Spaces and reuse a
  match; create one only when none fits.
- API base: `https://api.spacefast.com`

## Verify auth

`sf` is NOT on PATH — run the CLI through npx:

```bash
npx -y spacefast auth status --json
```

Expect `data.teams[0].slug == "sarthak927-team"`. If auth is missing or expired, ask the
user for a fresh handoff link and re-run:

```bash
npx -y spacefast setup agent --handoff --api-url https://api.spacefast.com --json
```

Pipe the handoff URL through stdin (file redirect or quoted heredoc) — never as a CLI
argument, and never echo it into logs or replies.

## Publish

Load the `spacefast` skill for mechanics. With stored auth:

```bash
npx -y spacefast spaces            # list team Spaces, reuse a matching spaceId
npx -y spacefast publish --space <spaceId>   # from the project/output dir
```

The CLI also supports direct-API fallback (`POST /v1/publish` with the stored bearer);
prefer `npx -y spacefast` subcommands over extracting the raw key.

## What setup installed (2026-09-22)

- Skill copies at `~/.agents/skills/spacefast`, `~/.claude/skills/spacefast`,
  `~/.cursor/skills/spacefast`, `~/.codex/skills/spacefast`, `~/.copilot/skills/spacefast`,
  `~/.config/opencode/skills/spacefast`, `~/.factory/skills/spacefast`.
  Tracked by `~/.spacefast/skills.json` — don't hand-edit the copies.
- MCP entries `{"command":"sf","args":["mcp","proxy"]}` written to:
  `~/.devin/mcp_config.json`, `~/.claude.json`, `~/.cursor/mcp.json`,
  `~/.codex/config.toml`, `~/.copilot/mcp-config.json`, `~/.config/zed/settings.json`,
  `~/.gemini/settings.json`, `~/.config/opencode/opencode.json`, `~/.warp/mcp.json`,
  `~/.factory/mcp.json`.
  These are inert until `sf` is installed globally
  (`curl -fsSL https://spacefast.com/install.sh | bash`) or the entries are repointed at
  `npx -y spacefast mcp proxy`.

## This skill's copies

`~/.config/devin/skills/spacefast-account/` is the canonical copy. Symlinks to it exist in
`~/.agents/skills/`, `~/.claude/skills/`, `~/.cursor/skills/`, `~/.codex/skills/`,
`~/.copilot/skills/`, `~/.config/opencode/skills/`, `~/.factory/skills/` so every local
agent sees the same note. Edit the canonical file, not a symlink.

## Secrets hygiene

Never print the API key, space keys, or claim/access URLs in replies, logs, commits, or
archives. Handoff links go via stdin only. `.spacefast/` project state stays out of
commits and publish archives.
