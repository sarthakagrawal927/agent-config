---
name: isolated-computer-use
description: Use Cua macOS VMs for native desktop automation and app GUI testing without taking over the owner's screen, cursor or keyboard. Apply when an agent would otherwise activate, click or type into host apps, or when isolated desktop testing is requested. Ordinary CLI, API and browser DOM automation do not need a VM.
---

# Isolated computer use

Keep native GUI work inside a Cua VM by default. The owner's explicit choice
of a host app, signed-in browser or physical device takes precedence; use that
authorized surface when it is necessary. Never silently fall back to the host
when a guest action fails. Existing authorization does not need another prompt.

## Pick an owned worker

Use the installed `cua` CLI and its MCP server. Check `cua --version`,
`cua runtime doctor`, and existing sandboxes before provisioning. The initial
Fleet installation uses Cua 0.16.0 and its built-in Lume 0.7.0; consult current
help when the installed version differs. Local workers require no Cua account.

Use [scripts/cua-mcp](scripts/cua-mcp) as the MCP command with argument `mcp`.
It requires Python 3 and the installed Cua CLI. Its guard refuses direct, relay,
cloud, bare-name and host targets, clears inherited daemon/default targets, and
runs an embedded producer. Only local Space creation, jobs, staged transfers,
guest tools and deletion are exposed. No pools, host adoption or sharing tools.
This constrains this MCP connection, not an agent's other unrestricted tools.

Read the live schemas. Create one worker with `create_space`: `on=local`,
`image=macos`, `kind=vm`, `runtime=lume`, `reuse=false`, `count=1`, `wait=false`.
Set `FLEET_CUA_OWNER` to a stable unique agent/task name in the MCP configuration
when reconnects are needed (Pace uses its own namespace). The guard records only
workers it created for that owner and refuses other local workers. Without that
setting, ownership lasts for this connection. Record its returned `local:<name>`
and task owner. Use `list_spaces` to establish
readiness. Address every subsequent call with that explicit `space` ID. Never
adopt, operate or remove another task's worker. A Mac supports at most two macOS
VMs; wait for capacity instead of evicting another worker or using the host.

Use `space_job` for long commands; retain job IDs and incremental log offsets.
Discover guest tools with `list_tools`, then invoke them through `call_tool`.
A starting job is not a passing test. Inspect existing state after uncertain
responses before retrying. Preserve active workers so disconnected work resumes.

Agents without MCP can use explicit `cua sb exec local:WORKER -- <command>` and
selected file transfers. Read current help first. Avoid `cua do switch` / `cua do`:
their selected target and screenshot state are shared between agents. If GUI
control is unavailable, report that gap rather than using the owner's desktop.

Keep host home directories, browser profiles, personal app data and credentials
out of workers. Stage only selected files or sanitized source archives needed for the task under
`~/Library/Application Support/Pace/testing/inputs/<task>/`. The guard refuses
other upload roots and folder uploads; it resolves the selected file path before forwarding. Downloads must remain under
`~/Library/Application Support/Pace/testing/results/`; the guard supplies a
worker subfolder when no destination is provided. Do not migrate sign-ins, expose a host service, share a worker
or publish a preview without the owner's request. Keep SIP and host permissions
intact. Guest permissions are separate from host permissions.

## Verify the result

Use the repository's build/test workflow inside the guest, including
XcodeBuildMCP where required. Bind the tested source revision and worker.
Build success, packaged startup and GUI behavior are separate checks.

Read the guest's UI state before acting and inspect fresh state afterward.
Verify typed text, navigation or saved output in app-owned state. A tool's
successful return alone does not prove the requested effect. After a timeout
or uncertain delivery, inspect first; do not repeat a possibly delivered action.

Report the actual workload and duration tested. A short check does not establish
24/7 reliability, physical-device parity or every app's behavior. Host-only
integration checks remain distinct and require the owner's applicable scope.

## Finish

Collect the requested results before removing the task's disposable worker with
the guarded `delete_space` tool with its explicit `space` ID. Preserve a worker the owner asked to retain,
or one containing unfinished work that has not been recovered; suspend it when
appropriate. Never clean other workers or retained user data by age alone.
Report the worker name and any remaining qualification gaps.
