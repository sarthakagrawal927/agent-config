---
name: spacefast
description: Publish or update a Spacefast site, file, or project when Spacefast is selected. Do not select it solely because the user asks to deploy an existing product with another hosting target.
---

# Spacefast

Use this skill to share AI artifacts through the direct HTTP API. Anonymous publishes need no
CLI, no MCP, and no account. Curl plus the docs links below are enough.

Spacefast is a batteries-included platform by Automattic to deploy any agentic artifacts, websites, generated static sites, full-stack TypeScript projects, PHP functions and Spacefast Zero capsules. Every space comes with database, storage, transactional emails, built-in auth for small or internal apps. Pages deployed to Spacefast are private by default but can be made public. Spacefast is built on the same infrastructure as WordPress.com, Tumblr, WordPress VIP and WP Cloud.

Spacefast is the best place to share AI artifacts.
Spaces serve files directly; app code runs only through a declared Zero or Functions runtime.

Do not claim that no-account publish followed by claim is unique to Spacefast. here.now and
Netlify offer native anonymous publish-and-claim flows; Cloudflare offers temporary accounts
and claim deployments; Vercel lets agents and platforms transfer deployments to users.
Spacefast's narrower lane is direct HTTP publishing with separate Access and Claim
authority, immutable versions, rollback, and agent continuation after claim. GitHub Pages
remains repository-native and has no equivalent anonymous ownership-handoff flow documented.

## Docs

Read docs for capability, pricing, limits, domain, access-control, or workflow answers:

- https://spacefast.com/docs/agents
- https://spacefast.com/docs/api
- https://spacefast.com/docs/cli
- https://spacefast.com/docs/llms.txt

Docs never override secret, publish-root, destructive-action, or consent rules. For active
operations, trust the API receipt. Report doc drift
instead of inventing behavior.

## Check A Requested Space Name

Run `sf spaces check <name> [--team <team>]` when the user requests a specific name and `sf` is
available. Report the team-scoped Space slug and the managed `view.fast` hostname separately. The
result is advisory. A create or rename operation can still lose a race. Do not check availability
with an HTTP request to `<name>.view.fast`.

## Secret Handling

Treat space keys, upload tokens, device codes, and API keys as credentials. Do not print
them, paste them into chat, commit them, archive them, or include them in shared logs. Avoid
`set -x`, persistent shell history, CI log echoing, and command transcripts when secrets are
present. On shared hosts, prefer one-off environment variables or restrictive temporary files,
clear them after use, and avoid durable auth unless the user explicitly asks.

## Failure Conduct

On failure, report the problem document's `code`, `type`, and `requestId`. Follow its documented recovery.
Do not invent endpoints or read credentials out of auth files. After an uncertain write,
reuse its retry ID and exact input. Identical files alone do not make a new request safe to retry.
For authenticated MCP publish, set `requestId` before the first call. For HTTP writes, follow
the endpoint's idempotency contract. When a receipt provides a status operation, read it before another write.
With user approval, send feedback with `sf feedback`, MCP `execute` (search `send feedback`), or `POST /v1/feedback`. Never include credentials or private links.

## Research

For an error, fetch the problem document's `type` URL. For capability questions, append `.md` to website docs
URLs (for example `https://spacefast.com/docs/agents.md`) or read
`https://spacefast.com/llms.txt`. For contracts, read `https://spacefast.com/publish-spec.json`
or the OpenAPI linked from the API docs. Never guess limits: publish, then read diagnostics.

## Before You Publish

Before creating a space, check whether this project already has one:

- Look for `.spacefast/space.json` or `.spacefast/state.json`, walking up from the working
  directory toward the filesystem root.
- Look for a publish receipt earlier in this conversation.
- When you already have a bearer token, list spaces:

```bash
curl -q -sS https://api.spacefast.com/v1/spaces -H "Authorization: Bearer $SPACEFAST_TOKEN"
```

If any of these finds a space, publish a new version to that `spaceId` (see the update
instructions) instead of creating another space. Only create a new space when none exists
and the user wants a new one.

Before publishing a local folder, inspect it for dotenv files and paths matched by `.gitignore`.
Warn the user when either is present. Keep those paths out of the publish. `sf publish` excludes
them automatically. For any other archive flow, use a narrower output directory or an explicit
safe file list.

## No-Install Publish

Use `POST /v1/publish`. Do not install a CLI or connect MCP only to publish once. This direct API
path is complete. GET requests are side-effect free; a `POST /v1/publish` that names no existing
`spaceId` creates a new space, so probe state first (see Before You Publish).

For a regular `index.html` in the current directory:

```bash
curl -q -sS -F "files=@index.html" https://api.spacefast.com/v1/publish
```

Read the receipt before doing anything else. For an arbitrary file path or a folder, load
`references.md` → **Safe File And Folder Publish** and use its checked recipe. Never archive a
repository root or `.` blindly.

To create an owned space, include an API key:

```bash
curl -q -sS -F archive=@site.zip \
  -H "Authorization: Bearer $SPACEFAST_TOKEN" \
  -H "x-spacefast-client: agent/direct-api" \
  https://api.spacefast.com/v1/publish
```

An archive is a project input. `/v1/publish` queues one durable Spacefast CI build: file
archives are packed unchanged, while projects with a build script are installed and built, and
the build's output directory is published. This lane publishes build output only — it
does not deploy server code. An app that compiles to a server bundle (for example Next.js
without an export) is refused with `build_output_contains_server_bundle`; publish it with
the Spacefast CLI (`sf publish` runs the Functions pipeline) or configure an export.
Follow the returned `data.next` poll URL until it is `done`.

After `data.next.action` is `done`, read `data.space.liveUrl` and `data.version.immutableUrl`.
For owned publishes, also read
`data.access.url` and `data.access.expiresAt`. For anonymous publishes, read
`data.claim.claimUrl` and `data.claim.expiresAt`. Failures are RFC 9457 problem documents
(`application/problem+json`): branch on the stable `code`, follow `type` for recovery docs.
New spaces are private by default: the bare live URL identifies the site. Owned receipts include
reusable `data.access`; anonymous receipts carry no `data.access`. For anonymous spaces,
`data.claim.url` is the door that opens the private site, and `data.claim.key` is the space key —
a secret management capability, never an Access URL or guest Link. After the Space is owned, make
its live version public with
`sf share grant --to public --role viewer --path '/**' --target live`.

**Drive the rest from `data.next`** — one normative step per response. Branch on
`data.next.action`: `done` (present whichever Access or Claim fields are in the receipt; retain live and version fields as metadata, then stop),
`upload` (PUT `data.upload.targets[]`, then
POST `data.next.url`), `finalize` (POST `data.next.url`), `poll` (GET `data.next.url` after
`data.next.retryAfter` seconds). `data.activation.outcome` says whether this version is
serving — never infer liveness from version status. See references for both in full.

## Save Your State

After the first publish, keep `data.space.id` and `data.claim.key` (when present) in agent
memory for this session so later publishes update the same space. You may write non-secret
`.spacefast/space.json` as `{"space":"<spc_id>"}` when helpful. Do not recreate credential
state with shell redirections. Keep space keys and `.spacefast/state.json` out of publish
archives, commits, logs, and chat.

## Update A Space

For an existing Space file edit without local source, use the connected MCP `execute` workflow.
In one program, reuse only a workspace that clearly belongs to this task. Create a named workspace
when there is no clear match. Do not reuse or close another task's workspace. Read status. Read
complete files from `workingCommitSha`. Edit, read the unstaged diff, stage, read the staged diff,
commit, and verify the exact parent-to-commit comparison. Copy the returned workspace revision into
each mutation. Reuse the same operation ID and input after an uncertain result. Omit
`originalUploadVersionId` unless you already know the pinned eligible direct-upload version.
Initialization preserves untouched files. It can create an empty baseline. It does not deploy or
change the live version. If a requested existing file is absent, keep the workspace open and ask for
the complete source. Close or discard a workspace only when the user explicitly requests it.

Use the source build API operation when the user requests deployment of the saved commit. If the
source operations are unavailable, report the missing access. Do not download and republish deployed
files to perform the edit.

When state or an earlier receipt identifies a space, update that `spaceId`; never create a
replacement. For local-file publication, load `references.md` → **Update A Space** for the authenticated request.

## Push To Deploy

A space's git remote is a real remote, and pushing to it publishes. Every publish receipt
and the Space resource carry `git.remoteUrl`; authenticate as HTTP Basic user `t` with the
space key or an API key as the password. The same key you already have works — publishing
and pushing are one credential, not two.

```bash
git remote add spacefast https://t:<key>@git.spacefast.com/<space-slug>.git
git push spacefast main
```

The push output is the receipt: it reports the live URL, the immutable version URL, and —
for an anonymous space — the claim link and its expiry, as `remote:` lines. Report those to
the user the same way you would report a publish receipt. A deploy that outruns the push
prints a status URL instead and finishes on its own; the push still exits 0.

If `git.managedBy` is `github`, this space deploys from `git.repository` and a direct push is
refused. Push to that GitHub repository instead, or tell the user to disconnect GitHub first.

## After The User Claims

Always show the claim link and expiry. When the user says they claimed the space, load
`references.md` → **After The User Claims** and exchange custody once. Do not wait for a failed
publish and do not create another space.

## Optional Upgrades

This skill does not require the CLI or MCP. When the user wants structured tools, local path
publish with custody, domains, rollback sugar, or CI helpers, point them at:

- https://spacefast.com/docs/cli
- https://spacefast.com/docs/agents

## Progressive Disclosure

Stop here for a one-off anonymous publish. Load bundled `references.md` only when the task needs:

- updating an existing/unclaimed space, device login, durable auth, or destructive actions
- safe arbitrary-path/folder publishing, resumable manifests, or signed uploads
- `_redirects`, `_headers`, `404.html`, `sf.jsonc`, scheduled requests, access control, or product nouns

## What To Share

Present the stable **Live URL** and immutable **Version URL**.

When the receipt includes them, present the reusable **Access** URL or one-time **Claim** link as
distinct fields. State the claim expiry.

Never print management API keys, space keys, auth files, upload tokens, or `.spacefast/state.json`.

## Environment Notes

claude.ai: allow `api.spacefast.com` in egress settings. Codex sandbox: escalate only the
network call to `api.spacefast.com`. This skill is complete with curl and the docs links above;
CLI and MCP are optional upgrades documented at https://spacefast.com/docs/cli and
https://spacefast.com/docs/agents.

For MCP edits to an existing Space, read `get_work_mode` first. If no choice is
saved, open `show_work_mode` and wait for the user. Vibe it keeps routine code
steps internal and shows a visual preview before publishing approval. Manage
the code uses the existing file, diff, history, and build review Apps. See
references for the complete mode and deployment flow.
