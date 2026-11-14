// @vitest-environment node
// scripts/webapp.sh (publish the web app to S3 + CloudFront, roll it back) against a stand-in aws CLI.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(ROOT, 'scripts/webapp.sh');
const FAKE = path.join(ROOT, 'scripts/fake-aws.cjs');
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);
const hasJq = spawnSync('jq', ['--version']).status === 0;

let dir;
let statePath;

const state = () => JSON.parse(fs.readFileSync(statePath, 'utf8'));
const object = (key) => state().objects[`web-bucket/${key}`];

function build(name, { assets = [`index-${name}.js`] } = {}) {
  const dist = path.join(dir, `dist-${name}`);
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), `<script src="/assets/${assets[0]}"></script> ${name}`);
  fs.writeFileSync(path.join(dist, 'sw.js'), `sw ${name}`);
  assets.forEach((asset) => fs.writeFileSync(path.join(dist, 'assets', asset), `code ${name}`));
  return dist;
}

function run(...args) {
  return spawnSync('bash', [SCRIPT, ...args], {
    encoding: 'utf8',
    env: {
      PATH: `${path.join(dir, 'bin')}:${process.env.PATH}`,
      FAKE_AWS_STATE: statePath,
      BUCKET: 'web-bucket',
      DISTRIBUTION_ID: 'E123',
      SUMMARY_FILE: path.join(dir, 'summary.md'),
    },
  });
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'webapp-'));
  statePath = path.join(dir, 'state.json');
  fs.writeFileSync(statePath, JSON.stringify({ objects: {} }));
  fs.mkdirSync(path.join(dir, 'bin'));
  fs.writeFileSync(path.join(dir, 'bin', 'aws'), `#!/bin/sh\nexec "${process.execPath}" "${FAKE}" "$@"\n`, {
    mode: 0o755,
  });
});

afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe.skipIf(!hasJq)('webapp.sh', () => {
  it('keeps the release and publishes it with the right cache headers', () => {
    const result = run('release', A, build('one'));
    expect(result.status, result.stderr).toBe(0);
    expect(object(`releases/${A}/index.html`).body).toContain('one');
    expect(object('live/index.html').body).toContain('one');
    expect(object('live/index.html').cacheControl).toBe('no-cache');
    expect(object('live/sw.js').cacheControl).toBe('no-cache');
    expect(object('live/assets/index-one.js').cacheControl).toBe('public, max-age=31536000, immutable');
    expect(object('live/assets/index-one.js')).toBeDefined();
    expect(object('releases/LIVE').body.trim()).toBe(A);
    expect(state().invalidations).toEqual([{ id: 'I1', paths: '/*' }]);
  });

  it('copies the assets before index.html', () => {
    run('release', A, build('one'));
    const copies = state().calls.filter((c) => c[1] === 'cp' && c[2].startsWith('s3://web-bucket/releases/'));
    expect(copies[0][3]).toBe('s3://web-bucket/live/assets');
    expect(copies[1][3]).toBe('s3://web-bucket/live');
  });

  it('rolls back to the previous release and keeps both releases assets live', () => {
    run('release', A, build('one'));
    run('release', B, build('two'));
    expect(object('live/index.html').body).toContain('two');

    const result = run('rollback', 'previous');
    expect(result.status, result.stderr).toBe(0);
    expect(object('live/index.html').body).toContain('one');
    expect(object('releases/LIVE').body.trim()).toBe(A);
    // A tab still on release two can load its chunks.
    expect(object('live/assets/index-two.js')).toBeDefined();
    expect(state().invalidations).toHaveLength(3);
    expect(fs.readFileSync(path.join(dir, 'summary.md'), 'utf8')).toContain(`Live web app: \`${A}\``);
  });

  it('rolls back to a named release', () => {
    run('release', A, build('one'));
    run('release', B, build('two'));
    expect(run('rollback', A).status).toBe(0);
    expect(object('live/index.html').body).toContain('one');
  });

  it('refuses a release that was never uploaded', () => {
    run('release', A, build('one'));
    const result = run('rollback', 'c'.repeat(40));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('::error title=Release not found::');
    expect(object('live/index.html').body).toContain('one');
  });

  it('refuses a target that is not a commit', () => {
    const result = run('rollback', 'latest; rm -rf /');
    expect(result.stderr).toContain('::error title=Bad release::');
    expect(state().calls ?? []).toEqual([]);
  });

  it('says so when there is nothing to roll back to', () => {
    run('release', A, build('one'));
    const result = run('rollback', 'previous');
    expect(result.stderr).toContain('::error title=Nothing to roll back to::');
  });

  it('publishes an already uploaded release as it is', () => {
    run('release', A, build('one'));
    const result = run('release', A, build('changed'));
    expect(result.status).toBe(0);
    expect(object('live/index.html').body).toContain('one');
  });

  it('needs its configuration', () => {
    const result = spawnSync('bash', [SCRIPT, 'rollback', 'previous'], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH },
    });
    expect(result.stderr).toContain('BUCKET is not set');
  });
});
