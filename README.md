# agent-config

The single Git source for the owner's global agent rules and every agent skill
on this machine. Private on purpose: it holds private skills and machine notes.

## Model

- `rules/` holds the global rules. `~/.codex/AGENTS.md` and `~/.claude/CLAUDE.md`
  are symlinks into this folder. **Edit the rules here (either path works), then
  commit and push.** `agent-config status` flags uncommitted edits, and a rules
  path that a tool replaced with a plain file.
- `skills.lock.json` lists every skill, where it comes from, and where it is linked:
  - `git-pinned`: a third-party repo at an exact commit (`url`, `commit`, `path`).
    Move it forward with `bump`.
  - `git-track`: the owner's own repos, following a branch (saas-maker `main`,
    codevetter `main`).
  - `local`: owner-private skills kept in `skills/` in this repo.
  - `app-bundled`: an explicit exception for skills that ship only inside an app
    (`path` plus the app version that was reviewed).
  - Optional on any entry: `overrides` (frontmatter keys to set), `include` (build
    the skill from several upstream paths), `patch` (a file in `patches/` that holds
    local edits). These are applied to the materialized copy only, never to upstream.
- Targets are `~/.agents/skills`, `~/.claude/skills`, `~/.codex/skills`, the Fleet
  folders `~/Desktop/fleet/.agents/skills` and `~/Desktop/fleet/.claude/skills`,
  and (for one note) `~/.config/devin/skills`. Every target entry is a symlink to
  `~/.local/share/agent-config/skills/<id>`. That path is a copy (pinned skills and
  skills with overrides), or a symlink into a source checkout or this repo.
- Source checkouts live in `~/.local/share/agent-config/src/<owner>__<repo>`.
  They are kept outside `~/Desktop` because macOS privacy rules block launchd there.
  `~/.local/share/fleet-skills/saas-maker` is a compatibility symlink to the
  saas-maker checkout.

## Commands

```sh
bin/agent-config sync [name...] [--adopt] [--skip-desktop]  # fetch, materialize, link
bin/agent-config status                                     # sources, SHAs, drift, unmanaged
bin/agent-config bump <name...|--all>                       # pinned entry -> latest upstream
bin/agent-config add <name> --git <url> --path <sub> --targets agents,claude
bin/agent-config add <name> --local <dir> --targets agents,claude
```

`sync` will not replace a real file or folder unless it is identical to the source
or you pass `--adopt`. Anything it replaces moves to
`~/.agent-config-backups/<date>/agent-config/`, and anything it removes goes to the
Trash. It never deletes.

The launchd job `com.sarthak.agent-config-sync` runs `sync --skip-desktop` every
hour. The log is `~/Library/Logs/com.sarthak.agent-config-sync.log`.

## Held pins

- **impeccable stays at skill 4.0.2** (`fc2e694`, tag `skill-v4.0.2`), matching
  saas-maker `tooling/config/design-workflow.json`. Reviewed 4.5.0 on 2026-10-09
  and declined it: 4.5 deletes the Node scripts (`scripts/hook.mjs`, the detector,
  `live-*`) and replaces them with a `scripts/impeccable` launcher that runs a
  platform binary not in the repo, fetched to a cache at runtime. That breaks the
  Fleet edit hook (`.claude/settings.local.json` runs
  `.claude/skills/impeccable/scripts/hook.mjs`) and adds an unreviewed binary
  download. Its content gains (mode references, component review, degraded
  fallbacks) do not outweigh that. Revisit if the hook moves to the new launcher.
  `bump impeccable` will keep reporting that the patch no longer applies.
- **xcodebuildmcp stays at tag v2.7.0.** Upstream 2.7.1 renamed the project to
  MobileBuildMCP (skill `mobilebuildmcp`, config dir `.mobilebuildmcp/`). The Codex
  MCP server is pinned to `xcodebuildmcp@2.7.0`, which reads `.xcodebuildmcp/`, so
  move the skill and the server pin in `~/.codex/config.toml` together.

## Superseded

`~/.agents/.skill-lock.json` (the `npx skills` CLI) is left in place for reference,
but this repo supersedes it. **Do not run `npx skills add` or `npx skills update`.**
They would write over managed links. Use `add` and `bump` here instead.
Likewise, add new skills here rather than through app installers
(`npx impeccable install`, `graphify install`, the `spacefast` CLI).
