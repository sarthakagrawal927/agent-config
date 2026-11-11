const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { createInterface } = require('node:readline');
const { test } = require('node:test');

const entry = path.join(__dirname, '../skills/isolated-computer-use/scripts/cua-mcp');

test('restricted entry point refuses host operations and extra flags before launch', () => {
  for (const args of [[], ['host', 'setup'], ['do', 'switch', 'host'],
    ['mcp', '--permissions', 'all'], ['daemon', 'mcp', '--sandbox', 'host']]) {
    const result = spawnSync('/bin/sh', [entry, ...args], {
      env: { ...process.env, FLEET_CUA_EXECUTABLE: '/does-not-exist' }, encoding: 'utf8',
    });
    assert.equal(result.status, 64);
  }
});

for (const mode of [['mcp'], ['daemon', 'mcp']]) {
  test(`${mode.join(' ')} guards requests and clears inherited routing`, async (t) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'isolated-computer-use-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const fake = path.join(dir, 'cua');
    fs.writeFileSync(fake, `#!/usr/bin/env python3
import json,os,sys
for line in sys.stdin:
 m=json.loads(line)
 print(json.dumps({'jsonrpc':'2.0','id':m['id'],'result':{'structuredContent':{'id':'local:'+m['params']['arguments']['name']} if m.get('params',{}).get('name')=='create_space' else {},'received':m,'argv':sys.argv[1:],'env':{k:os.environ.get(k) for k in ['CUA_SANDBOX','CUA_DAEMON','CUA_DAEMON_TOKEN','CUA_MCP_PERMISSIONS','CUA_RUNTIME_LUME_VNC','CUA_DEFAULT_ON','CUA_POOL_AUTO']}}}),flush=True)
`);
    fs.chmodSync(fake, 0o755);
    const child = spawn('/bin/sh', [entry, ...mode], {
      env: { ...process.env, FLEET_CUA_EXECUTABLE: fake, HOME: dir, CUA_MCP_PERMISSIONS: 'all',
        CUA_SANDBOX: 'host', CUA_DAEMON: 'http://localhost:1', CUA_DAEMON_TOKEN: 'fixture',
        CUA_DEFAULT_ON: 'direct:unwanted-host' },
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    t.after(() => child.kill());
    const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();
    let sequence = 0;
    async function call(name, args) {
      const id = ++sequence;
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call',
        params: { name, arguments: args } }) + '\n');
      const { value, done } = await lines.next();
      assert.equal(done, false);
      const response = JSON.parse(value);
      assert.equal(response.id, id);
      return response;
    }
    for (const space of ['host', 'worker', 'direct:127.0.0.1:7777', 'relay:owner', 'cloud:worker', '', 'local:../host']) {
      assert.match((await call('call_tool', { space, tool: 'click' })).error.message, /local:/);
    }
    for (const name of ['add_space', 'share_space', 'sandbox_pool_create', 'computer_click']) {
      assert.ok((await call(name, { space: 'local:worker' })).error);
    }
    for (const params of [null, []]) {
      const id = ++sequence;
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params }) + '\n');
      const response = JSON.parse((await lines.next()).value);
      assert.equal(response.id, id);
      assert.match(response.error.message, /Malformed/);
    }
    const create = { on: 'local', image: 'macos', kind: 'vm', runtime: 'lume', reuse: false, count: 1, wait: false };
    for (const overrides of [{ on: 'default' }, { on: 'host:owner' }, { reuse: true }, { count: 2 }, { volumes: ['/Users'] }]) {
      assert.ok((await call('create_space', { ...create, ...overrides })).error);
    }
    const result = (await call('create_space', create)).result;
    const { name, ...forwarded } = result.received.params.arguments;
    assert.match(name, /^fleet-connection-[a-f0-9-]+$/);
    assert.deepEqual(forwarded, create);
    assert.deepEqual(result.argv.slice(0, 5), ['mcp', '--embedded', '--sandbox', '', '--permissions']);
    assert.equal(result.env.CUA_SANDBOX, null);
    assert.equal(result.env.CUA_DAEMON, null);
    assert.equal(result.env.CUA_DAEMON_TOKEN, null);
    assert.equal(result.env.CUA_DEFAULT_ON, 'local');
    assert.equal(result.env.CUA_RUNTIME_LUME_VNC, 'disabled');
    assert.equal(result.env.CUA_POOL_AUTO, 'off');
    assert.ok(!result.env.CUA_MCP_PERMISSIONS.includes(':all'));
    assert.ok((await call('delete_space', { space: 'local:other-worker' })).error);
    assert.ok((await call('send_file', { space: 'local:' + name, path: path.join(dir, '.ssh') })).error);
    assert.ok((await call('download', { space: 'local:' + name, path: '/tmp/x', dest: path.join(dir, 'Library/LaunchAgents') })).error);
    const inputs = path.join(dir, 'Library/Application Support/Pace/testing/inputs');
    fs.mkdirSync(inputs, { recursive: true });
    fs.symlinkSync(dir, path.join(inputs, 'escape'));
    assert.ok((await call('send_file', { space: 'local:' + name, path: path.join(inputs, 'escape/.ssh') })).error);
    fs.writeFileSync(path.join(inputs, 'source.tar'), 'fixture source');
    const upload = await call('send_file', { space: 'local:' + name, path: path.join(inputs, 'source.tar') });
    assert.equal(upload.result.received.params.arguments.path, path.join(fs.realpathSync(inputs), 'source.tar'));
    const download = await call('download', { space: 'local:' + name, path: '/tmp/report.md' });
    assert.ok(download.result.received.params.arguments.dest.endsWith('/Pace/testing/results/' + name));
    const guest = await call('call_tool' , { space: 'local:' + name, tool: 'get_ui_state', arguments: {} });
    assert.equal(guest.result.received.params.arguments.space, 'local:' + name);
    await call('delete_space', { space: 'local:' + name });
    assert.ok((await call('call_tool', { space: 'local:' + name, tool: 'click' })).error);
    child.stdin.end();
  });
}
