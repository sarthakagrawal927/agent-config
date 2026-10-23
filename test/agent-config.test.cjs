'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

function fixture(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-config-test-'));
  t.after(() => assert.equal(spawnSync('/usr/bin/trash', [home]).status, 0));
  const repo = path.join(home, '.agent-config');
  const upstream = path.join(home, '.local/share/agent-config/src/example__skills');
  const target = path.join(home, '.agents/skills');
  for (const dir of [repo, upstream, target]) fs.mkdirSync(dir, { recursive: true });
  const git = (dir, ...args) => {
    const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  for (const dir of [repo, upstream]) git(dir, 'init', '-q');
  const content = '---\nname: example\ndescription: A fixture skill.\n---\nOriginal content.\n';
  fs.writeFileSync(path.join(upstream, 'SKILL.md'), content);
  git(upstream, 'add', 'SKILL.md');
  git(upstream, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.com', 'commit', '-qm', 'fixture');
  const entry = { name: 'example', type: 'git-pinned', url: 'https://github.com/example/skills.git',
    commit: git(upstream, 'rev-parse', 'HEAD'), path: '.', targets: ['agents'] };
  const lock = { version: 1, targets: { agents: target }, skills: [entry] };
  const save = () => fs.writeFileSync(path.join(repo, 'skills.lock.json'), JSON.stringify(lock));
  save();
  const calls = [];
  const messages = [];
  const context = vm.createContext({
    __dirname: path.join(repo, 'bin'),
    console: { log: (s) => messages.push(s), error: (s) => messages.push(s) },
    process: { argv: ['node', 'agent-config'], execPath: process.execPath, env: process.env },
    require(name) {
      if (name === 'os') return { homedir: () => home };
      if (name === 'child_process') return { spawnSync(command, args, options) {
        if (args[0] === path.join(repo, 'bin/export-npx-attribution')) {
          calls.push(Array.from(args));
          return { status: 0, stdout: '', stderr: '' };
        }
        return spawnSync(command, args, options);
      } };
      return require(name);
    },
  });
  const source = fs.readFileSync(path.join(__dirname, '../bin/agent-config'), 'utf8');
  vm.runInContext(source + '\nglobalThis.api = { cmdSync, cmdStatus, applyCodexPolicy, flags: FLAGS };', context);
  return { home, repo, upstream, target, content, entry, save, calls, messages, api: context.api };
}

test('adopts an identical install with a recovery copy and refreshes attribution', (t) => {
  const f = fixture(t);
  const installed = path.join(f.target, 'example');
  fs.mkdirSync(installed);
  fs.writeFileSync(path.join(installed, 'SKILL.md'), f.content);
  assert.equal(f.api.cmdSync(['example']), 0);
  assert.ok(fs.lstatSync(installed).isSymbolicLink());
  const day = new Date().toISOString().slice(0, 10);
  const backup = path.join(f.home, '.agent-config-backups', day, 'agent-config/.agents/skills/example/SKILL.md');
  assert.equal(fs.readFileSync(backup, 'utf8'), f.content);
  assert.equal(f.calls.length, 1);
  assert.equal(f.api.cmdSync(['example']), 0, 'repeated sync converges');
});

test('refuses to overwrite a differing install and returns failure', (t) => {
  const f = fixture(t);
  const installed = path.join(f.target, 'example');
  fs.mkdirSync(installed);
  fs.writeFileSync(path.join(installed, 'SKILL.md'), 'Unrecorded local work.');
  assert.equal(f.api.cmdSync(['example']), 1);
  assert.equal(fs.readFileSync(path.join(installed, 'SKILL.md'), 'utf8'), 'Unrecorded local work.');
});

test('preserves edited materializations and reports the skipped sync as failure', (t) => {
  const f = fixture(t);
  assert.equal(f.api.cmdSync(['example']), 0);
  const materialized = path.join(f.home, '.local/share/agent-config/skills/example/SKILL.md');
  fs.appendFileSync(materialized, 'Local edit.\n');
  assert.equal(f.api.cmdSync(['example']), 1);
  assert.match(fs.readFileSync(materialized, 'utf8'), /Local edit/);
});

test('preserves an unrecorded materialization when the state file is missing', (t) => {
  const f = fixture(t);
  const materialized = path.join(f.home, '.local/share/agent-config/skills/example');
  fs.mkdirSync(materialized, { recursive: true });
  fs.writeFileSync(path.join(materialized, 'SKILL.md'), 'Work whose state was lost.');
  assert.equal(f.api.cmdSync(['example']), 1);
  assert.equal(fs.readFileSync(path.join(materialized, 'SKILL.md'), 'utf8'), 'Work whose state was lost.');
});

test('status detects an installed revision behind the manifest', (t) => {
  const f = fixture(t);
  assert.equal(f.api.cmdSync(['example']), 0);
  f.entry.commit = 'a'.repeat(40);
  f.save();
  assert.equal(f.api.cmdStatus(), 1);
  assert.ok(f.messages.some((s) => s.includes('STALE')));
});

test('JSON status exposes drift and source ownership without instruction bodies', (t) => {
  const f = fixture(t);
  assert.equal(f.api.cmdSync(['example']), 0);
  f.api.flags.json = true;
  f.messages.length = 0;
  assert.equal(f.api.cmdStatus(), 0);
  assert.equal(f.messages.length, 1);
  const report = JSON.parse(f.messages[0]);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.summary.entryCount, 1);
  assert.equal(report.skills[0].revision, f.entry.commit);
  assert.equal(report.skills[0].sourceURL, f.entry.url);
  assert.equal(report.scope, 'all registered targets');
  assert.ok(!f.messages[0].includes('Original content.'));
  f.entry.overrides = { description: 'A revised skill' };
  f.save();
  assert.equal(f.api.cmdStatus(), 1);
  assert.equal(JSON.parse(f.messages.at(-1)).skills[0].status, 'STALE-RECIPE');
});

test('changing patch contents invalidates the installed recipe without changing the pin', (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.repo, 'patches'));
  const patch = path.join(f.repo, 'patches/example.patch');
  const body = '--- a/SKILL.md\n+++ b/SKILL.md\n@@ -5 +5 @@\n-Original content.\n+Patched content.\n';
  fs.writeFileSync(patch, body);
  f.entry.patch = 'patches/example.patch';
  f.save();
  assert.equal(f.api.cmdSync(['example']), 0);
  fs.writeFileSync(patch, body.replace('Patched content.', 'Updated patch.'));
  assert.equal(f.api.cmdStatus(), 1);
  assert.ok(f.messages.some((s) => s.includes('STALE-RECIPE')));
});

test('status detects a materialized link that bypasses the pinned copy', (t) => {
  const f = fixture(t);
  assert.equal(f.api.cmdSync(['example']), 0);
  const dest = path.join(f.home, '.local/share/agent-config/skills/example');
  fs.renameSync(dest, dest + '.saved');
  fs.symlinkSync(f.upstream, dest);
  assert.equal(f.api.cmdStatus(), 1);
  assert.ok(f.messages.some((s) => s.includes('WRONG-SOURCE')));
});

test('applies explicit-only policy to root and nested skills without losing metadata', (t) => {
  const f = fixture(t);
  const nested = path.join(f.upstream, 'upstream/skills/leaf');
  fs.mkdirSync(path.join(nested, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(nested, 'SKILL.md'), f.content);
  const config = path.join(nested, 'agents/openai.yaml');
  fs.writeFileSync(config, 'interface:\n  display_name: "Leaf"\npolicy:\n  allow_implicit_invocation: true\ndependencies:\n  tools: []\n');
  f.api.applyCodexPolicy(f.upstream);
  assert.equal(fs.readFileSync(path.join(f.upstream, 'agents/openai.yaml'), 'utf8'), 'policy:\n  allow_implicit_invocation: false\n');
  const first = fs.readFileSync(config, 'utf8');
  assert.match(first, /display_name: "Leaf"/);
  assert.match(first, /dependencies:\n  tools: \[\]/);
  assert.match(first, /allow_implicit_invocation: false/);
  f.api.applyCodexPolicy(f.upstream);
  assert.equal(fs.readFileSync(config, 'utf8'), first);
});

test('skip-desktop also applies to attribution and health checks', (t) => {
  const f = fixture(t);
  const lockFile = path.join(f.repo, 'skills.lock.json');
  const lock = JSON.parse(fs.readFileSync(lockFile));
  lock.targets['fleet-agents'] = path.join(f.home, 'Desktop/fleet/.agents/skills');
  lock.skills[0].targets.push('fleet-agents');
  fs.writeFileSync(lockFile, JSON.stringify(lock));
  f.api.flags['skip-desktop'] = true;
  assert.equal(f.api.cmdSync(['example']), 0);
  assert.ok(f.calls[0].includes('--skip-desktop'));
  assert.equal(fs.existsSync(path.join(f.home, 'Desktop')), false);
  assert.throws(() => f.api.cmdSync(['misspelled']), /unknown skill/);
});
