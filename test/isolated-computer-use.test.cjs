const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

const entry = path.join(__dirname, '../skills/isolated-computer-use/scripts/cua-mcp');

test('restricted entry point refuses host operations and extra server flags before launching Cua', () => {
  for (const args of [[], ['host', 'setup'], ['do', 'switch', 'host'],
    ['mcp', '--permissions', 'all'], ['daemon', 'mcp', '--sandbox', 'host']]) {
    const result = spawnSync('/bin/sh', [entry, ...args], {
      env: { ...process.env, FLEET_CUA_EXECUTABLE: '/does-not-exist' }, encoding: 'utf8',
    });
    assert.equal(result.status, 64);
    assert.match(result.stderr, /Use this entry point/);
  }
});

test('both supported MCP registration forms start only the restricted guest tool groups', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'isolated-computer-use-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fake = path.join(dir, 'cua');
  fs.writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$@" "permissions=$CUA_MCP_PERMISSIONS" "vnc=$CUA_RUNTIME_LUME_VNC" "tracking=$DO_NOT_TRACK" "target=\${CUA_SANDBOX-unset}" "location=$CUA_DEFAULT_ON"\n`);
  fs.chmodSync(fake, 0o755);
  for (const args of [['mcp'], ['daemon', 'mcp']]) {
    const result = spawnSync('/bin/sh', [entry, ...args], {
      env: { ...process.env, FLEET_CUA_EXECUTABLE: fake, CUA_MCP_PERMISSIONS: 'all',
        CUA_SANDBOX: 'host', CUA_DEFAULT_ON: 'direct:unwanted-host' },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stdout.trim().split('\n'), [
      'mcp', '--permissions', 'images:readonly,sandbox:all,computer:all',
      'permissions=images:readonly,sandbox:all,computer:all', 'vnc=disabled', 'tracking=1',
      'target=unset', 'location=local',
    ]);
  }
});
