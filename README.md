# agent-config

The Git source for owner-managed global agent rules, skill sources and host
adaptations on this machine. Provider plugins and system skills remain managed
by their providers. This repository is public; keep credentials and private
account information outside it.

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
  - `local`: owner-authored skills kept in `skills/` in this repo.
  - `app-bundled`: an explicit exception for skills that ship only inside an app
    (`path` plus the app version that was reviewed).
  - Optional on any entry: `overrides` (frontmatter keys to set), `include` (build
    the skill from several upstream paths), `patch` (a file in `patches/` that holds
    local edits). These are applied to the materialized copy only, never to upstream.
  - `codexExplicitOnly: true`: generate Codex's supported
    `agents/openai.yaml` invocation policy beside every included `SKILL.md`,
    including nested skills. Preserve other metadata. PStack is opt-in; its
    nested entries remain discoverable. Prefer `$pstack` to load the host adapter.
- Targets are `~/.agents/skills`, `~/.claude/skills`, `~/.codex/skills`, the Fleet
  folders `~/Desktop/fleet/.agents/skills` and `~/Desktop/fleet/.claude/skills`,
  existing OpenClaw, Cursor, Devin and Grok aliases, and registered archived
  Fleet aliases. Partial target directories retain their other owners' entries.
  Every registered target entry is a symlink to
  `~/.local/share/agent-config/skills/<id>`. That path is a copy (pinned skills and
  skills with overrides), or a symlink into a source checkout or this repo.
- Source checkouts live in `~/.local/share/agent-config/src/<owner>__<repo>`.
  They are kept outside `~/Desktop` because macOS privacy rules block launchd there.
  `~/.local/share/fleet-skills/saas-maker` is a compatibility symlink to the
  saas-maker checkout.

## Commands

```sh
bin/agent-config sync [name...] [--adopt] [--skip-desktop]  # fetch, materialize, link
bin/agent-config status [--json]                            # sources, SHAs, drift, unmanaged
bin/agent-config schedule                                   # install hourly macOS maintenance
bin/agent-config bump <name...|--all>                       # pinned entry -> latest upstream
bin/agent-config add <name> --git <url> --path <sub> --targets agents,claude
bin/agent-config add <name> --local <dir> --targets agents,claude
node bin/export-npx-attribution                           # metadata only; sync does this automatically
node --test test/*.test.cjs                               # isolated management regression checks
```

`sync` will not replace a real file or folder unless it is identical to the source
or you pass `--adopt`. Anything it replaces moves to
`~/.agent-config-backups/<date>/agent-config/`, and anything it removes goes to the
Trash. It never deletes.

`sync` refreshes attribution and checks health before returning. A skipped edit,
stale pin, missing target or unmanaged skill makes it return nonzero. It refuses
different unrecorded materialized content even if its state file is missing.

Install or repair the hourly job from the canonical checkout with
`bin/agent-config schedule`. The launchd job `com.sarthak.agent-config-sync`
runs `sync --skip-desktop`; its log is
`~/Library/Logs/com.sarthak.agent-config-sync.log`. macOS blocks unattended
Desktop access, so run a manual full `sync` after changing Fleet skills.
The job follows owner-repository branches; it does not bump third-party pins.

For maintenance, run `status`, review a selected upstream change with
`bump <name>`, then run `sync` and a real task appropriate to that skill. Inspect
the diff before committing. For a conflicting install, identify its exact
revision and preserve edits as a patch before adopting it. Use `--adopt` only
after that comparison. Keep useful common skills global, project-specific
skills scoped, and experimental workflows opt-in. Avoid duplicate copies.
To roll back an update, restore its manifest entry and patch from Git and sync;
replaced installations are also retained in the dated backup directory.

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

## npx compatibility

`~/.agents/.skill-lock.json` and Fleet's `skills-lock.json` provide source
attribution for `npx skills list --global --json` and `npx skills list --json`.
Every sync exports
this manifest's sources and pins, labels owner-authored and app-bundled skills as local,
preserves existing npx installations' records, and backs up metadata it changes.
The exporter reads installed directories without downloading or executing an npm
package. It does not install, update or relink skills. Plugin and system skill catalogs
remain owned by their providers. This repo remains the installation authority.
**Do not run `npx skills add` or `npx skills update` over managed skills.**
They would write over managed links. Use `add` and `bump` here instead.
Likewise, add new skills here rather than through app installers
(`npx impeccable install`, `graphify install`, the `spacefast` CLI).

ContextDaddy reads `status --json` schema 1 without syncing or changing skills.
The report separates registered installation health from hourly maintenance and
broader discovery. Changed pin, patch, or invocation recipes require sync before
the materialized copy is current. Existing archive and agent aliases are registered
without changing the capabilities each agent had available.
