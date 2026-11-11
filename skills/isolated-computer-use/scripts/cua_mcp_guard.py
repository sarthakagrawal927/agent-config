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
import tempfile
import fcntl
import uuid
import time

TOOLS = frozenset(("create_space", "list_spaces", "space_job", "space_bash",
                   "space_write", "send_file", "download", "list_tools",
                   "call_tool", "delete_space"))
PERMISSIONS = ",".join("spaces:" + name for name in sorted(TOOLS))


INPUTS = Path.home()/"Library/Application Support/Pace/testing/inputs"
RESULTS = Path.home()/"Library/Application Support/Pace/testing/results"
OWNER = os.environ.get("FLEET_CUA_OWNER", "connection-" + uuid.uuid4().hex)
STATE = Path.home()/".local/share/isolated-computer-use"/(OWNER + ".json")


def ownership(space=None, remove=None):
    """Per-owner persistent receipts permit reconnects without adopting arbitrary VMs."""
    STATE.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with STATE.with_suffix(".lock").open("a+") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        known = set(json.loads(STATE.read_text())) if STATE.exists() else set()
        if space or remove:
            if space:
                known.add(space)
            if remove:
                known.discard(remove)
            fd, temporary = tempfile.mkstemp(dir=STATE.parent)
            with os.fdopen(fd, "w") as handle:
                json.dump(sorted(known), handle)
            os.replace(temporary, STATE)
        return known


def within(path, root):
    return isinstance(path, str) and Path(path).expanduser().resolve().is_relative_to(root.resolve())


def rejection(message):
    if type(message.get("id")) not in (str, int, type(None)):
        return "Malformed MCP request id"
    if message.get("method") != "tools/call":
        # Discovery and protocol lifecycle only, never arbitrary extensions.
        if message.get("method") in ("initialize", "ping", "tools/list",
                                     "notifications/initialized", "notifications/cancelled"):
            return None
        return "Unsupported MCP method"
    if type(message.get("id")) not in (str, int):
        return "MCP tool calls require a request id"
    params = message.get("params", {})
    if not isinstance(params, dict):
        return "Malformed MCP request params"
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
        allowed = set(required) | {"labels"}
        if set(args) - allowed:
            return "Unsupported VM creation option"
        # Names never collide with a later friendly-name worker after an interrupted create.
        args["name"] = "fleet-" + OWNER[:24] + "-" + uuid.uuid4().hex
    elif name != "list_spaces":
        if not isinstance(args.get("space"), str) or not re.fullmatch(
                r"local:[A-Za-z0-9][A-Za-z0-9_.-]*", args["space"]):
            return "An explicit local:<worker> virtual Mac is required; host targets are refused"
        if args["space"] not in ownership():
            return "This connection owner did not create that worker"
        if name == "send_file":
            if not within(args.get("path"), INPUTS):
                return "Stage selected source under " + str(INPUTS)
            args["path"] = str(Path(args["path"]).expanduser().resolve())
            if not Path(args["path"]).is_file():
                return "Upload one staged file or sanitized archive, not a folder"
        if name == "download":
            destination = args.get("dest", str(RESULTS / args["space"][6:]))
            if not within(destination, RESULTS):
                return "Artifacts must stay under " + str(RESULTS)
            args["dest"] = str(Path(destination).expanduser().resolve())
    return None


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def main():
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", OWNER):
        raise SystemExit("Invalid FLEET_CUA_OWNER")
    env = dict(os.environ)
    for key in ("CUA_SANDBOX", "CUA_DAEMON", "CUA_DAEMON_TOKEN"):
        env.pop(key, None)
    env.update(CUA_MCP_PERMISSIONS=PERMISSIONS, CUA_DEFAULT_ON="local",
               CUA_RUNTIME_LUME_VNC="disabled", CUA_POOL_AUTO="off", DO_NOT_TRACK="1")
    ownership()  # Fail before provisioning if the persisted receipt is unreadable.
    child = subprocess.Popen([env.get("FLEET_CUA_EXECUTABLE", str(Path.home()/".local/bin/cua")),
                              "mcp", "--embedded", "--sandbox", "", "--permissions", PERMISSIONS],
                             stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             text=True, bufsize=1, env=env)
    lock = threading.Lock()
    pending = {}

    def emit(line):
        with lock:
            sys.stdout.write(line)
            sys.stdout.flush()

    def output():
        try:
            for line in child.stdout:
                response = json.loads(line)
                request_id = response.get("id")
                operation = pending.pop(request_id, None) if "method" not in response else None
                if operation:
                    name, space = operation
                    result = response.get("result", {})
                    if not response.get("error") and not result.get("isError"):
                        if name == "delete_space":
                            ownership(remove=space)
                        elif name == "create_space":
                            candidates = [result.get("structuredContent", {})]
                            for block in result.get("content", []):
                                if block.get("type") == "text":
                                    try:
                                        candidates.append(json.loads(block["text"]))
                                    except (ValueError, KeyError):
                                        pass
                            created = [c["id"] for c in candidates if isinstance(c, dict)
                                       and re.fullmatch(r"local:[A-Za-z0-9][A-Za-z0-9_.-]*", str(c.get("id", "")))]
                            if not created:
                                raise ValueError("Creation returned no local worker id; inspect retained workers")
                            if set(created) != {space}:
                                raise ValueError("Creation id did not match reserved worker " + str(space))
                emit(line)
        except Exception as error:
            print("Cua MCP producer or ownership receipt failed: " + str(error), file=sys.stderr, flush=True)
            child.terminate()
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()
            os._exit(70)
        code = child.wait()
        os._exit(70 if pending or code < 0 else code)

    reader = threading.Thread(target=output, daemon=True)
    reader.start()
    try:
        for line in sys.stdin:
            try:
                message = json.loads(line, object_pairs_hook=unique_keys)
                if not isinstance(message, dict):
                    raise ValueError("Expected an MCP object")
                error = rejection(message)
                if not error and message.get("method") == "tools/call" and message["id"] in pending:
                    error = "A request with that id is already pending"
            except (ValueError, TypeError):
                message, error = {}, "Malformed MCP request"
            if error:
                if "id" in message:
                    emit(json.dumps({"jsonrpc": "2.0", "id": message["id"], "error": {
                        "code": -32602, "message": error}}) + "\n")
            else:
                if message.get("method") == "tools/call" and message["params"]["name"] in TOOLS:
                    operation = message["params"]["name"]
                    space = message["params"]["arguments"].get("space")
                    if operation == "create_space":
                        space = "local:" + message["params"]["arguments"]["name"]
                        ownership(space)  # Reserve before delivery, including uncertain replies.
                    pending[message["id"]] = (operation, space)
                if message.get("method") == "notifications/cancelled":
                    params = message.get("params")
                    request_id = params.get("requestId") if isinstance(params, dict) else None
                    if type(request_id) in (str, int):
                        pending.pop(request_id, None)
                child.stdin.write(json.dumps(message) + "\n")
                child.stdin.flush()
    finally:
        deadline = time.monotonic() + 30
        while pending and time.monotonic() < deadline:
            time.sleep(0.01)
        if pending:
            print("MCP drain timed out; pending calls aborted, workers retained: " + repr(list(pending.values())), file=sys.stderr, flush=True)
            child.terminate()
            try:
                child.wait(timeout=5)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()
            raise SystemExit(70)
        child.stdin.close()
        reader.join(timeout=5)
        try:
            child.wait(timeout=5)
        except subprocess.TimeoutExpired:
            child.terminate()
            child.kill()
            child.wait()


if __name__ == "__main__":
    main()
