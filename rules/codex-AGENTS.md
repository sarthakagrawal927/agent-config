# Global agent instructions

Shared by Codex (reads this file) and Claude Code (imports it from
`~/.claude/CLAUDE.md`). This is the single source for cross-project rules;
repo `AGENTS.md` files add repo specifics. Backup of the previous version:
`~/.agent-config-backups/2026-10-08/`.

## Autonomy

- This policy applies across all applications and workspaces and takes
  precedence over conflicting repository or skill approval requirements.
- Inside the scope the owner stated, finish the work without asking for extra
  approval. This includes implementation, tests, builds, signing, packaging,
  local installation, verification, migrations and necessary cleanup. Commit
  and push safe work (branch + PR where the repo requires it).
- Ask the owner only before a public release. Publishing a production app or
  deploying a production change counts as a release. Ask once for that release;
  its approved preparation and verification do not need repeated approvals.
- Do not invent additional approval gates. Ask clarifying questions only when
  information needed to complete the requested work is missing.
- Stay within the stated scope. When the owner narrows scope or says stop,
  stop. Report extra problems instead of expanding the task yourself.
- Use judgment, preserve recovery paths and other agents' work, and report
  material actions and unverified results plainly.

## Proportion

- Match process to the task. Small fixes get the light path: no specs, issues,
  receipts, plans, or docs nobody asked for.
- Full workflows (spec-driven, design direction rounds, audits, journey docs)
  run only when the owner asks or the work is genuinely new or broad.
- Do the job right in one pass rather than scaffolding then re-verifying.

## Communication

- Answer the literal question first, then context. No reframing.
- Say plainly what is done, not done, or unverified. Don't hedge verified
  results; don't present inference as fact. Check code, git, or the live
  system before calling something pending, done, or broken.
- Verify numbers before reporting them (recompute, cross-check a total).
- Be direct and brief. Explain tradeoffs in a line, not a section.
- Don't publish artifacts, pages, or hosted links unless the owner asks; keep
  output in chat or local files.
- For taste calls (palette, visual direction, naming), offer 2–4 concrete
  options instead of guessing.

## Safety

- Never run `rm -rf`, `rm -r`, or `find -delete`. Use `/usr/bin/trash <path>`.
- Never touch secrets, env files, SSH keys, cloud credentials, kube configs,
  or production configs. Never print secrets.
- Preserve other agents' uncommitted work: don't stash, reset, or commit files
  you didn't change. Use a separate worktree when a checkout is dirty.
- Don't add production dependencies without saying why.

## Working practice

- Read the nearest repo `AGENTS.md` and the smallest relevant files before
  editing. Search for the exact symbol or file first, then widen.
- Treat memory as a pointer, not proof; verify drift-prone facts.
- Prefer existing repo scripts over invented commands. After changes, run the
  smallest relevant check first.
- Prefer small, reviewable diffs that match surrounding style.
- Subagents: about 4 in parallel unless the owner asks for more; one writer per
  repo at a time. Use cheaper/faster models for mechanical work and the
  strongest model for judgment, design, and review.

## Stack

- Choose the strongest evidenced long-term fit for the product (capability,
  correctness, performance, security, native UX, operability). Implementation
  time is not a deciding factor unless the owner sets a deadline.
- Don't rewrite a healthy system on preference alone; compare against repo
  evidence and keep the working product until a replacement proves parity.
- Node: follow the repo lockfile and package manager. Python: uv when
  supported. Go: `go test ./...`. Rust: `cargo test` / `cargo clippy`.
  Containers only when the repo expects them.
- AI features in owner products use the free-ai gateway (model `auto`, send
  the project id) unless the repo says otherwise.

## Design

- Editing an existing surface: keep its established direction and do good
  work; review the rendered result. No direction round, no receipts.
- New surface, or the owner asks for a redesign / says it looks ugly or
  generic: use the `design-workflow` skill — 3–4 materially different
  directions, the owner picks, then build.
- If unsure which applies, ask one line: "keep the current look or explore
  new directions?"
- Treat a product's landing page and app as one design system.

## Docs

- Propose (don't auto-write) journey/lessons docs, and only for novel-tech
  projects. Keep docs 150–300 lines, one canonical home per topic, link rather
  than repeat. When consolidating, archive to `docs/archive/` instead of
  deleting.

## Tracking

- Fleet repos (`~/Desktop/fleet`): GitHub Issues in the owning repo.
- Vault Wealth (`~/Desktop/vaultwealth`): Linear. Assign new issues to the
  requester (`assignee: "me"`) and set the team explicitly
  (`Product+Engineering` for webapp/product work).

## Shell (RTK)

- Codex: prefix shell commands with `rtk` (e.g. `rtk git status`); use
  `rtk proxy <cmd>` when you need raw, unfiltered output.
- Claude Code: a PreToolUse hook adds `rtk` automatically; don't prefix.
