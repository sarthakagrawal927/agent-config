'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

test('persists content-only changes for an externally attributed Fleet skill', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'npx-attribution-test-'));
  try {
    const repo = path.join(fixture, '.agent-config');
    const fleet = path.join(fixture, 'Desktop/fleet');
    const skill = path.join(fleet, '.agents/skills/external');
    fs.mkdirSync(repo, { recursive: true });
    fs.mkdirSync(skill, { recursive: true });
    fs.writeFileSync(path.join(repo, 'skills.lock.json'), JSON.stringify({
      skills: [], targets: { 'fleet-agents': path.dirname(skill) },
    }));
    const content = path.join(skill, 'SKILL.md');
    fs.writeFileSync(content, '---\nname: external\ndescription: fixture\n---\nFirst version.\n');
    const lockFile = path.join(fleet, 'skills-lock.json');
    fs.writeFileSync(lockFile, JSON.stringify({ version: 1, skills: {
      external: { source: 'example/source', sourceType: 'github', computedHash: 'stale' },
    } }));
    const source = fs.readFileSync(path.join(__dirname, '../bin/export-npx-attribution'), 'utf8');
    const run = () => {
      const before = fs.readFileSync(content);
      vm.runInNewContext(source, {
        __dirname: path.join(repo, 'bin'),
        console: { log() {} },
        process: { stderr: { write() {} } },
        require(name) {
          if (name === 'os') return { homedir: () => fixture };
          if (name === 'child_process') return { spawnSync(command, args) {
            assert.fail(`export must not download or execute a CLI: ${command}`);
          } };
          return require(name);
        },
      });
      assert.deepEqual(fs.readFileSync(content), before);
      return fs.readFileSync(lockFile, 'utf8');
    };
    const first = JSON.parse(run()).skills.external;
    assert.notEqual(first.computedHash, 'stale', 'a hash-only change must reach disk');
    assert.equal(first.source, 'example/source');
    fs.appendFileSync(content, 'A useful new instruction.\n');
    const secondText = run();
    const second = JSON.parse(secondText).skills.external;
    assert.notEqual(second.computedHash, first.computedHash, 'editing skill content must refresh the stored hash');
    assert.equal(run(), secondText, 'an unchanged export must be idempotent');
  } finally {
    const result = spawnSync('/usr/bin/trash', [fixture], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('scheduled attribution does not read archived Desktop targets', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'npx-attribution-desktop-'));
  try {
    const repo = path.join(fixture, '.agent-config');
    const agents = path.join(fixture, '.agents/skills');
    const archive = path.join(fixture, 'Desktop/fleet-archive/example/.agents/skills');
    fs.mkdirSync(repo, { recursive: true });
    fs.mkdirSync(agents, { recursive: true });
    fs.writeFileSync(path.join(repo, 'skills.lock.json'), JSON.stringify({ skills: [], targets: { agents, archive } }));
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../bin/export-npx-attribution'), 'utf8'), {
      __dirname: path.join(repo, 'bin'), console: { log() {} },
      process: { argv: ['node', 'export', '--skip-desktop'] },
      require(name) {
        if (name === 'os') return { homedir: () => fixture };
        if (name === 'fs') return { ...fs, readdirSync(dir, ...args) {
          assert.ok(!dir.startsWith(path.join(fixture, 'Desktop')), 'unattended export must not inspect Desktop');
          return fs.readdirSync(dir, ...args);
        } };
        return require(name);
      },
    });
  } finally {
    assert.equal(spawnSync('/usr/bin/trash', [fixture]).status, 0);
  }
});
