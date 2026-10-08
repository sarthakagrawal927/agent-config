---
name: spacefast-references
description: "Deep reference for the Spacefast curl/API skill — device-login JSON shapes, the resumable manifest flow, local-state and update rules, space-file conventions, and product nouns. Loaded on demand from SKILL.md."
---

# Spacefast — References

Deep reference for the Spacefast skill. The router and the load-bearing publish path live in
`SKILL.md`. This file holds everything an agent loads only when the task needs it. Nothing here
overrides the safety rules in `SKILL.md`.

## Safe File And Folder Publish

Use these recipes for arbitrary file paths and folders. They reject symlinks and unsafe folder
contents before any network request.

Publish a single file after rejecting symbolic links in the file or any existing ancestor:
Set `SPACEFAST_PUBLISH_TARGET` through the agent runtime/environment, not by interpolating
a repository path into this source. The recipe passes it as a separately quoted argv element.
Fresh serving capacity can make the first request take longer while Spacefast provisions it:

```bash
: "${SPACEFAST_PUBLISH_TARGET:?set this through the runtime environment}"
bash -s -- "$SPACEFAST_PUBLISH_TARGET" <<'SPACEFAST_PUBLISH'
set -euo pipefail
publish_target="$1"
case "$publish_target" in -*) publish_target="./$publish_target" ;; esac
case "$publish_target" in /*) check_path="$publish_target" ;; *) check_path="$PWD/$publish_target" ;; esac
remaining="${check_path#/}"; check_path="/"
while [ -n "$remaining" ]; do
  case "$remaining" in */*) component="${remaining%%/*}"; remaining="${remaining#*/}" ;; *) component="$remaining"; remaining="" ;; esac
  case "$component" in ""|.) continue ;; ..) check_path="${check_path%/*}"; [ -n "$check_path" ] || check_path="/"; continue ;; esac
  [ "$check_path" = "/" ] && check_path="/$component" || check_path="$check_path/$component"
  [ ! -L "$check_path" ] || { printf "error: symbolic link in publish path: %s\n" "$check_path" >&2; exit 2; }
done
[ -f "$publish_target" ] || { printf "error: publish file is not a regular file\n" >&2; exit 2; }
escaped_path="${publish_target//\\/\\\\}"
escaped_path="${escaped_path//\"/\\\"}"
api_origin="${SPACEFAST_API_ORIGIN:-https://api.spacefast.com}"
curl -q -sS -F "files=@\"$escaped_path\"" \
  "$api_origin/v1/publish"
SPACEFAST_PUBLISH
```

Publish a folder by zipping only the intended public output root. Do not archive a repository
root or `.` blindly. Before zipping, confirm the publish root contains no secrets, source
control, auth state, unrelated build/cache folders, or symbolic links:
Set `SPACEFAST_PUBLISH_TARGET` through the agent runtime/environment. It is passed as a
separately quoted argv element and is never evaluated as outer shell source:

```bash
: "${SPACEFAST_PUBLISH_TARGET:?set this through the runtime environment}"
bash -s -- "$SPACEFAST_PUBLISH_TARGET" <<'SPACEFAST_PUBLISH'
set -euo pipefail
publish_target="$1"
case "$publish_target" in -*) publish_target="./$publish_target" ;; esac
case "$publish_target" in /*) check_path="$publish_target" ;; *) check_path="$PWD/$publish_target" ;; esac
remaining="${check_path#/}"; check_path="/"
while [ -n "$remaining" ]; do
  case "$remaining" in */*) component="${remaining%%/*}"; remaining="${remaining#*/}" ;; *) component="$remaining"; remaining="" ;; esac
  case "$component" in ""|.) continue ;; ..) check_path="${check_path%/*}"; [ -n "$check_path" ] || check_path="/"; continue ;; esac
  [ "$check_path" = "/" ] && check_path="/$component" || check_path="$check_path/$component"
  [ ! -L "$check_path" ] || { printf "error: symbolic link in publish path: %s\n" "$check_path" >&2; exit 2; }
done
[ -d "$publish_target" ] || { printf "error: publish folder is not a directory\n" >&2; exit 2; }
unsafe_path="$(find "$publish_target" \( -name ".env*" -o -name ".npmrc" -o -name ".netrc" -o -path "*/.git/*" -o -path "*/.spacefast/*" -o -path "*/.ssh/*" -o -path "*/.aws/*" -o -path "*/.kube/*" -o -path "*/.docker/*" -o -name "credentials.json" -o -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.pfx" -o -name "*.crt" -o -name "*id_rsa*" -o -name ".git" -o -name ".spacefast" -o -name ".ssh" -o -name ".aws" -o -name ".kube" -o -name ".docker" -o -name "node_modules" -o -name ".next" -o -name ".nuxt" -o -name ".cache" -o -name ".turbo" -o -name "coverage" \) -print -quit)"
[ -z "$unsafe_path" ] || { printf "error: unsafe entry in publish root: %s\n" "$unsafe_path" >&2; exit 2; }
! find "$publish_target" -type l -print -quit | grep -q . || { printf "error: symbolic link in publish root\n" >&2; exit 2; }
secure_python=""
for candidate in /usr/bin/python3.14 /usr/bin/python3.13 /usr/bin/python3.12 /usr/bin/python3.11 /usr/bin/python3.10 /usr/bin/python3.9 /usr/bin/python3.8 /usr/local/bin/python3.14 /usr/local/bin/python3.13 /usr/local/bin/python3.12 /usr/local/bin/python3.11 /usr/local/bin/python3.10 /usr/local/bin/python3.9 /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.14 /opt/homebrew/bin/python3.13 /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11 /opt/homebrew/bin/python3.10 /opt/homebrew/bin/python3.9; do
  [ -x "$candidate" ] && [ -f "$candidate" ] || continue
  case "$candidate" in /opt/homebrew/*) ;; *) [ ! -L "$candidate" ] || continue ;; esac
  secure_python="$candidate"; break
done
[ -n "$secure_python" ] || { printf "error: trusted python3 is required for a race-safe archive\n" >&2; exit 2; }
"$secure_python" -I - "$publish_target" <<'SPACEFAST_ARCHIVE' | curl -q -sS -F 'archive=@-;filename="spacefast-site.zip"' https://api.spacefast.com/v1/publish
import fnmatch, os, stat, sys, zipfile
directory_flags = os.O_RDONLY | os.O_DIRECTORY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
file_flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
excluded_directories = {".git", ".spacefast", ".ssh", ".aws", ".kube", ".docker"}
excluded_files = (".env*", ".npmrc", ".netrc", "credentials.json", "*.pem", "*.key", "*.p12", "*.pfx", "*.crt", "*id_rsa*", "*.zip", "*.tar", "*.tgz")
def excluded(path):
    parts = path.split("/")
    return any(part in excluded_directories for part in parts[:-1]) or any(fnmatch.fnmatchcase(parts[-1], pattern) for pattern in excluded_files)
def same(left, right): return (left.st_dev, left.st_ino) == (right.st_dev, right.st_ino)
def walk(archive, directory_fd, prefix=""):
    for name in sorted(os.listdir(directory_fd)):
        archive_name = f"{prefix}/{name}" if prefix else name
        if excluded(archive_name): continue
        entry = os.stat(name, dir_fd=directory_fd, follow_symlinks=False)
        if stat.S_ISLNK(entry.st_mode): raise RuntimeError(f"symbolic link in publish root: {archive_name}")
        if stat.S_ISDIR(entry.st_mode):
            child_fd = os.open(name, directory_flags, dir_fd=directory_fd)
            try:
                if not same(os.fstat(child_fd), entry): raise RuntimeError(f"directory changed while opening: {archive_name}")
                walk(archive, child_fd, archive_name)
            finally: os.close(child_fd)
            continue
        if not stat.S_ISREG(entry.st_mode) or entry.st_nlink != 1: raise RuntimeError(f"unsafe publish entry: {archive_name}")
        file_fd = os.open(name, file_flags, dir_fd=directory_fd)
        try:
            opened = os.fstat(file_fd); current = os.stat(name, dir_fd=directory_fd, follow_symlinks=False)
            if opened.st_nlink != 1 or not same(opened, entry) or not same(opened, current): raise RuntimeError(f"file changed while opening: {archive_name}")
            info = zipfile.ZipInfo(archive_name); info.compress_type = zipfile.ZIP_DEFLATED; info.external_attr = (opened.st_mode & 0xFFFF) << 16
            with archive.open(info, "w") as output:
                while True:
                    chunk = os.read(file_fd, 65536)
                    if not chunk: break
                    output.write(chunk)
        finally: os.close(file_fd)
path = os.path.normpath(sys.argv[1] if os.path.isabs(sys.argv[1]) else os.path.join(os.getcwd(), sys.argv[1]))
root_fd = os.open("/", directory_flags)
try:
    for component in [part for part in path.split("/") if part]:
        next_fd = os.open(component, directory_flags, dir_fd=root_fd); os.close(root_fd); root_fd = next_fd
    with zipfile.ZipFile(sys.stdout.buffer, "w", allowZip64=True) as archive: walk(archive, root_fd)
finally: os.close(root_fd)
SPACEFAST_ARCHIVE
SPACEFAST_PUBLISH
```

The preflight exits before upload when it finds a credential-like file, repository/auth state,
an unrelated build/cache directory, or a symbolic link. Choose a narrower generated output
directory or remove the unsafe entry before trying again.

## Update A Space

For an existing Space file edit without local source, use connected MCP source tools instead of this upload workflow.
Use one MCP `execute` program. Reuse only a workspace that clearly belongs to this task. Create a
named workspace when there is no clear match. Do not reuse or close another task's workspace. Read
status. Read complete files from `workingCommitSha`. Edit, read the unstaged diff, stage, read the
staged diff, commit, and verify the exact parent-to-commit comparison. Use the returned revisions
and retry-safe operation IDs. Omit `originalUploadVersionId` unless you already know the pinned
eligible direct-upload version. Initialization can create an empty baseline. It does not deploy or
change the live version. If a requested existing file is absent, keep the workspace open and ask for
the complete source. Close or discard a workspace only when the user explicitly requests it.

Use the source build API operation for a requested deployment of the saved commit. Report unavailable
source operations instead of republishing deployed files.

Prefer current local state when present (walk up from the working directory):

- project state: `.spacefast/state.json` (and non-secret `.spacefast/space.json`)
- auth state: `~/.spacefast/auth.json`

Treat state files as private cache only. Never commit them, never show space keys, and never tell
the user to inspect state for the claim link or auth status. Persist non-secret space identity after
a first publish so later publishes update the same space (see Save Your State in `SKILL.md`).

To publish a new version of an existing space, send the same `spaceId` with bearer auth —
never re-run the first-publish recipe when saved state exists:

```bash
curl -q -sS -H "Authorization: Bearer <space-key-or-access-token>" \
  --form-string 'spaceId=<spc_id>' \
  -F "files=@index.html" \
  https://api.spacefast.com/v1/publish
```

Use the saved space key for an unclaimed anonymous space, or an access token for owned
spaces. Send a folder or project as `-F archive=@site.zip` exactly like a first publish.
Archive uploads return a durable Build receipt; follow `data.next` until the version is ready.

## After The User Claims

Always show the user the claim link (`data.claim.claimUrl`) and its expiry (`data.claim.expiresAt`).
If the user says "claimed", check claim status and exchange the saved space key; do not wait
for a publish failure before continuing.
After the user claims the space in the browser, the saved space key stops authorizing
publishes: the next publish fails with error code `space_claimed_credential_available`. That
failure is the signal to upgrade your credential — call the exchange endpoint exactly once:

```bash
curl -q -sS -X POST -H "Authorization: Bearer <space-key>" \
  https://api.spacefast.com/v1/claim/exchange
```

It returns `{ "data": { "space": {...}, "credential": { "accessToken": "...", "label": "..." } } }`.
Save `data.credential.accessToken` into `.spacefast/state.json` (replace the `claimToken`
field with `"accessToken"`), then retry the publish with the new bearer. The exchange works
exactly once; if it returns `continuation_used` or `continuation_unavailable`, ask the user
to create an API key in the dashboard (team → Agents → API keys).

## The Publish Receipt

Every publish mutation answers with the same receipt. Two fields drive an agent:

`data.next` is the normative next step — the server's projection of (version status, activation
outcome, pending bytes, operation state). Branch on `data.next.action`:

| action     | meaning                           | do                                                                          |
| ---------- | --------------------------------- | --------------------------------------------------------------------------- |
| `done`     | This request's intent is settled. | Present Access and Claim; keep serving/version addresses as metadata. Stop. |
| `upload`   | Bytes are missing.                | PUT each `data.upload.targets[]` entry, then POST `data.next.url`.          |
| `finalize` | All declared bytes are present.   | POST `data.next.url` to commit the version.                                 |
| `poll`     | Server-side work is in flight.    | GET `data.next.url` after `data.next.retryAfter` seconds.                   |

`data.activation` reports whether the version is serving. Liveness is a channel pointer, never a
version status:

- `activated` — the live pointer moved to this version.
- `unpromoted` — ready without promotion, because the request asked for `channel: null`.
- `superseded` — ready, but a newer publish holds the pointer. `data.activation.currentLiveVersionId`
  names the winner; POST the promote link to take it back.
- `pending` — not settled yet. Follow `data.next`.

## `--json` Receipts And Stderr

With `--json`, success receipts go to stdout as `{ "data": ... }` and **failures go to stderr** as
`{ "error": { "code", "message", "retryable" } }` — stdout stays empty so `sf ... --json | jq`
never parses an error as data. Read the exit code and stderr together; an empty stdout with a
non-zero exit is an error envelope waiting on stderr, not a silent success.

## Manifest Flow

For larger or resumable uploads, use the manifest flow:

1. `POST /v1/publish` with JSON `{ "spaceId": "...", "files": [{ "path", "size", "contentType", "sha256", "sourceUrl" }] }`.
   `sha256` is optional: omit it to start a path upload immediately and let the runtime hash the
   bytes, or include it to use content-addressed targets that can reuse bytes retained from the
   base version.
2. For each `data.upload.targets[]`, send `target.method` to `target.url` with `target.headers`.
3. If `target.body.kind` is `"url"`, send JSON `{ "url": target.body.url }`. Otherwise send the local file bytes for `target.path`.
4. POST `data.next.url` when `data.next.action` is `finalize`. When it is `upload`, POST the same
   URL to get a fresh receipt and repeat from step 2 with the targets it returns.
5. Keep following `data.next` — `poll` means GET `data.next.url` after `data.next.retryAfter`
   seconds — until `data.next.action` is `done`.
6. Share the final `liveUrl`, `immutableUrl`, and diagnostics.

If no files changed, the API may omit `upload` and answer `data.next.action: "done"` directly;
report the receipt and diagnostics rather than inventing a separate success signal. `data.activation`
carries whether the version is serving (`activated`), deliberately unpromoted, `superseded` by a
newer publish, or still `pending`.

Do not base64 large files into chat. Use inline multipart only for small files; prefer the manifest
flow or a zip archive for folders.

## Device Login

Use device login when the user wants owned/permanent publishes and no API key is available.
This does not require the CLI or MCP.

Start (`POST /v1/auth/device`) with the access you want. `agent` is the default and covers
publishing, domains, and Spacefast tools; use `read` when the credential only has to look:

```bash
curl -q -sS https://api.spacefast.com/v1/auth/device \
  -H "content-type: application/json" \
  -d '{"access":"agent"}'
```

Show the user the returned `data.verificationUrl` and `data.userCode` exactly, and say which access
you asked for. The approval page names that one request ("Agent access") and asks which teams it
covers — there is no preset picker and no permission checklist to walk. Individual permissions live
behind "Customize" for anyone who wants to narrow the grant, so tell them to open the link,
enter/confirm the code if needed, pick teams, and approve.

With the CLI, the same choice is `sf login` (agent access) or `sf login --access read`.

Poll (`POST /v1/auth/device/poll`) no faster than `data.interval` seconds:

```bash
curl -q -sS https://api.spacefast.com/v1/auth/device/poll \
  -H "content-type: application/json" \
  -d '{"deviceCode":"<data.deviceCode>"}'
```

Handle poll statuses:

- `pending`: wait `interval` seconds and poll again.
- `approved`: capture `data.apiKey.secret` immediately. It is shown only once. `data.access` reports
  what was actually granted (`profile`, `scopes`, `teams`) — read that, not `data.apiKey.preset`,
  and tell the user if the approver narrowed the request.
- `denied`, `expired`, or `consumed`: stop and start a new device flow if the user still wants login.
- `slow_down` or HTTP 429: increase the wait. Repeated fast polls can invalidate the code.

For a one-off operation, keep the key in `SPACEFAST_TOKEN` only. Before durable persistence, ask the
user if they want this machine to stay signed in. Do not persist auth by default on CI, shared
hosts, or throwaway agent sandboxes. To save the key for future direct API use, write
`~/.spacefast/auth.json` atomically with mode `0600`:

```json
{
  "accessToken": "<api-key-secret>",
  "apiUrl": "https://api.spacefast.com",
  "accessTokenId": "<api-key-id-if-returned>",
  "account": { "id": "<subject-or-user-id>", "email": "<email-if-known>" }
}
```

After approval, always validate saved or in-memory auth with `GET /v1/me`:

```bash
curl -q -sS https://api.spacefast.com/v1/me -H "Authorization: Bearer $SPACEFAST_TOKEN"
```

For claiming an anonymous space during login, start the device flow with:

```json
{
  "claim": { "spaceId": "spc_...", "claimToken": "<space-key>" }
}
```

Approval claims the space into the chosen team. The next successful poll includes
`data.claimedSpaceId`.

### Mint A CI Deploy Key

Bootstrap CI with a narrowly-scoped key — never hand CI a personal session token:

1. Run device login (above) and capture `data.apiKey.secret` once from the approved poll.
2. With that token, `POST /v1/api-keys` for a `ci_deploy` (or narrower) key. See
   https://spacefast.com/docs/api for the exact body.
3. Pipe the one-time secret into the CI secret store without echoing it to logs or chat.
4. In CI, send `Authorization: Bearer $SPACEFAST_TOKEN` on publish.

## Space Files

Spacefast recognizes these files in the published directory:

- `_redirects` for redirects, rewrites, custom 404 rules, and external `200` proxy rules
- `_headers` for supported response headers
- nearest `404.html`
- `sf.jsonc` for serving config (index, fallback, listing, meta, templates, theme), the optional
  `space` link, optional `redirects` / `rewrites` / `headers` arrays, and optional `crons`

Spacefast publishes artifacts. Server-executable files are never run by Spacefast Runtime.

Use `_redirects` for proxying:

```text
/api/* https://api.example.com/:splat 200
```

Do not create `.spacefast/proxy.json`. Internal `200` destinations are rewrites. Only absolute
external URL destinations with status `200` are proxy rules.

`sf.jsonc` states the same rules with the same matcher grammar `_redirects` and `_headers` use
(`*` splats, `:placeholder` captures, absolute-URL sources) — no second syntax, just JSON arrays
for when generating a text file is the awkward part:

```jsonc
{
  "redirects": [{ "source": "/old-blog/*", "destination": "/blog/:splat", "status": 301 }],
  "rewrites": [
    { "source": "/app/*", "destination": "/app/index.html" },
    {
      "source": "/api/*",
      "destination": "https://api.example.com/:splat",
      "cache": "shared",
    },
  ],
  "headers": [{ "source": "/*", "headers": [{ "key": "X-Frame-Options", "value": "DENY" }] }],
}
```

- `redirects` answer with a `Location`. `status` is optional and defaults to `302`; allowed values
  are `301`, `302`, `303`, `307`, `308`. `"status": 200` is rejected — that rule is a rewrite.
- `rewrites` keep the URL and serve the destination: a path rewrites, an absolute URL proxies.
  They carry no status. `cache: "shared"` applies to proxy rewrites only.
- Header entries are a `key`/`value` list, not an object, so repeated names survive.
- Conditions, query captures, forced statuses, `404` rules, and header removals stay in the files.
- `{{ vars.NAME }}` resolves in these strings exactly as it does in the convention files.

The files win; `sf.jsonc` is additive. `_redirects` rules match first, then config `redirects`,
then config `rewrites`, so a config rule only routes what the files leave alone; when a `_headers`
block and a config rule set the same header name, the file's value ships. A config rule repeating
a source a file rule already answers publishes with a `redirect_shadowed_by_file` warning against
its own line in the config file.

`crons` asks Spacefast to request the space's own paths on a schedule:

```jsonc
{ "crons": [{ "path": "/api/digest", "schedule": "0 5 * * *" }] }
```

Schedules are `hourly`, `daily`, `twicedaily`, `weekly`, an `Nh`/`Nd`/`Nw` interval, or a
five-field crontab expression — no `@daily` macros. Paths are literal, at most 8 entries. The
live version's config is the whole truth: publishing changes the schedule, a rollback restores
the previous one, and removing the key stops the work. Run `sf crons ls` to see what is
scheduled and `sf crons run <key>` to exercise one now. To prove a request came from the
schedule, declare a `CRON_SECRET` variable and check `authorization: Bearer <CRON_SECRET>` in the
handler.

New spaces are private. After upload, widen access only through explicit Grants. Use Public or
Team audiences for broad access, People or Links for human sharing, passwords for shared proof,
and machine or external-identity audiences for integrations. An anonymous Space must be claimed
before its access policy can change. After claiming, make the live Space public with
`sf share grant --to public --role viewer --path '/**' --target live`.

More: https://spacefast.com/docs/publish · https://spacefast.com/docs/access

## Plan-Gated Behavior

Do not guess whether a workspace is on a free or paid plan. For ordinary public artifacts, publish
the user's intended artifact, then read and report API/runtime diagnostics. For private
or access-controlled artifacts, use the fail-closed rule above before uploading content.

When a feature is plan-gated:

- Say exactly what the diagnostic says.
- Use this plain wording when explaining gates: "Not available on Free. Available on Plus and Pro."
- For external proxy routes, keep the `_redirects` rule if the user asked for it, but explain that
  the runtime may serve a platform page until the space has the required plan.
- For large files, report the blocked paths and size diagnostics. Do not rewrite or delete user
  files unless the user asks.
- Version URLs are immutable published versions. Report the receipt's access URL when the user
  needs no-login browser access to a Version.

## Product Rules

Use Spacefast's user-facing nouns consistently:

- `space` is the main object.
- `publish` is the canonical action. `deploy` is its exact alias. A project directory with a
  detected build command builds automatically. With curl, send one `.zip`, `.tar.gz`, or `.tgz`
  project archive to `/v1/publish`; the returned Build receipt drives the same poll loop.
- `version` is an immutable snapshot.
- `domain` is user-facing. Avoid `hostname` except for DNS diagnostics.
- `API key`, `space key`, and `claim link` have distinct meanings.

Default to correctness over speed. An API publish is complete only when `data.next.action` is
`done` and the intended version is serving; a successful `sf publish` has already followed that
continuation for you.

## Optional CLI And MCP

Not required by this skill. When the user wants them:

- CLI: https://spacefast.com/docs/cli
- Agents / MCP: https://spacefast.com/docs/agents

## References

- Agent guide: https://spacefast.com/docs/agents
- API docs and OpenAPI: https://spacefast.com/docs/api
- CLI docs: https://spacefast.com/docs/cli
- CLI command help: `sf help` and `sf <command> --help`
- Publish contract: https://spacefast.com/publish-spec.json
- Error reference: https://spacefast.com/docs/errors
- Machine-readable index: https://spacefast.com/docs/llms.txt

### MCP review mode

Before editing an existing Space, call `get_work_mode` with its exact Space ID.
If no mode is saved, call `show_work_mode` and wait for the user's choice.
Never select the mode for the user. Reuse the saved choice on later requests.

In **Vibe it**, handle routine edits, staging, commits, and builds internally.
Disable the relevant automatic deployment setting before committing, then
verify `workspace.autoDeploy` is false. Build with
`body.target: { preview: false, channel: null }`. Show the exact ready version
with the preview App, then request publishing approval separately.
Do not show file, diff, history, or log Apps unless the user asks.

In **Manage the code**, show the existing file sidebar, diffs, commit history,
and build logs at the relevant review steps. Both modes keep scoped edits,
revision guards, verification, and explicit deployment approval.
