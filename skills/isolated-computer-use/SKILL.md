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

Create a worker for this task, with a generated or unique name:

```sh
cua sb create macos --on local --kind vm --runtime lume \
  --cpu 4 --memory 8GB --wait desktop
```

Record the returned `local:<name>` and use it throughout the task. Do not adopt,
operate or remove another agent's worker. One agent controls a given desktop
at a time. macOS workers currently have a two-VM host limit; if both slots are
occupied, continue independent work and wait for capacity. Do not evict another
worker or substitute the physical desktop.

## Address every action

Prefer Cua MCP tools. Supply the explicit worker reference in the `sandbox`
argument of every `computer_*` call; lifecycle tools take their documented
`name` argument. Read the tool schema before using an unfamiliar action.

For shell work, use an explicit reference as well:

```sh
cua sb exec local:WORKER -- uname -a
cua sb cp ./selected-source.tar local:WORKER:/tmp/selected-source.tar
cua sb screenshot local:WORKER
```

Avoid `cua do switch` / `cua do` for concurrent agents: their selected target
and screenshot coordinate state are shared in `~/.cua/do_target.json`.
If an agent has no MCP integration, discover the worker's declared MCP service
and use `cua sb mcp NAME SERVICE tools` / `call` with an explicit worker. If
that route is unavailable, retain the shell checks and report GUI control as
unavailable; do not replace it with host input.

Keep host home directories, browser profiles, personal app data and credentials
out of workers. Transfer only the source, fixtures and artifacts needed for the
authorized task. Do not migrate sign-ins, expose a host service, share a worker
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
`cua sb rm local:WORKER --force`. Preserve a worker the owner asked to retain,
or one containing unfinished work that has not been recovered; suspend it when
appropriate. Never clean other workers or retained user data by age alone.
Report the worker name and any remaining qualification gaps.
