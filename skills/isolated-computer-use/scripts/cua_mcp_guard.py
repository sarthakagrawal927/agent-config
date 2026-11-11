"""JSON-lines MCP routing guard for local Cua virtual Macs.

No SDK dependency. The child retains MCP request IDs, schemas and content.
This constrains this connection, not other tools an agent may possess.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading

TOOLS = frozenset(("create_space", "list_spaces", "space_job", "space_bash",
                   "space_write", "send_file", "download", "list_tools",
                   "call_tool", "delete_space"))
PERMISSIONS = ",".join("spaces:" + name for name in sorted(TOOLS))


def rejection(message):
    if message.get("method") != "tools/call":
        # Discovery and protocol lifecycle only, never arbitrary extensions.
        if message.get("method") in ("initialize", "ping", "tools/list",
                                     "notifications/initialized", "notifications/cancelled"):
            return None
        return "Unsupported MCP method"
    params = message.get("params", {})
    name, args = params.get("name"), params.get("arguments", {})
    if name not in TOOLS or not isinstance(args, dict):
        return "Only the isolated testing tools are available"
    if name == "create_space":
        required = {"on": "local", "kind": "vm", "runtime": "lume",
                    "image": "macos", "reuse": False, "count": 1, "wait": False}
        if any(type(args.get(key)) is not type(value) or args.get(key) != value
               for key, value in required.items()):
            return "Create one fresh local macOS Lume VM with wait=false"
        # Do not accept host mounts, service addresses or future placement extensions.
        allowed = set(required) | {"cpu", "memory", "labels"}
        if set(args) - allowed:
            return "Unsupported VM creation option"
    elif name != "list_spaces":
        if not isinstance(args.get("space"), str) or not re.fullmatch(
                r"local:[A-Za-z0-9][A-Za-z0-9_.-]*", args["space"]):
            return "An explicit local:<worker> virtual Mac is required; host targets are refused"
    return None


def main():
    env = dict(os.environ)
    for key in ("CUA_SANDBOX", "CUA_DAEMON", "CUA_DAEMON_TOKEN"):
        env.pop(key, None)
    env.update(CUA_MCP_PERMISSIONS=PERMISSIONS, CUA_DEFAULT_ON="local",
               CUA_RUNTIME_LUME_VNC="disabled", CUA_POOL_AUTO="off", DO_NOT_TRACK="1")
    child = subprocess.Popen([env.get("FLEET_CUA_EXECUTABLE", str(Path.home()/".local/bin/cua")),
                              "mcp", "--embedded", "--sandbox", "", "--permissions", PERMISSIONS],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             text=True, bufsize=1, env=env)
    lock = threading.Lock()

    def emit(line):
        with lock:
            sys.stdout.write(line)
            sys.stdout.flush()

    def output():
        for line in child.stdout:
            emit(line)
        # End the connection when its producer disappears; no silent restart/replay.
        os._exit(child.wait())

    threading.Thread(target=output, daemon=True).start()
    try:
        for line in sys.stdin:
            try:
                message = json.loads(line)
                if not isinstance(message, dict):
                    raise ValueError("Expected an MCP object")
                error = rejection(message)
            except (ValueError, TypeError):
                message, error = {}, "Malformed MCP request"
            if error:
                if "id" in message:
                    emit(json.dumps({"jsonrpc": "2.0", "id": message["id"], "error": {
                        "code": -32602, "message": error}}) + "\n")
            else:
                child.stdin.write(line)
                child.stdin.flush()
    finally:
        child.terminate()
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            child.kill()
            child.wait()


if __name__ == "__main__":
    main()
