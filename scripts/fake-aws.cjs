#!/usr/bin/env node
// A stand-in for the `aws` CLI, just enough of S3 and CloudFront for scripts/webapp.sh (tests only).
// State is a JSON file named by FAKE_AWS_STATE: { objects: { "<bucket>/<key>": { body, cacheControl } },
// invalidations: [...], calls: [...] }.

const fs = require('node:fs');
const path = require('node:path');

const statePath = process.env.FAKE_AWS_STATE;
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const argv = process.argv.slice(2);
state.calls = [...(state.calls || []), argv];

const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const s3 = (url) => url.startsWith('s3://') && url.slice(5);
const excluded = (relative) => argv.includes('--exclude') && relative.startsWith(option('--exclude').replace('*', ''));

function listLocal(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listLocal(full) : [full];
  });
}

function copyOne(body, to, meta) {
  const target = s3(to);
  if (target) {
    state.objects[target] = { body, cacheControl: option('--cache-control') ?? meta?.cacheControl };
  } else {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.writeFileSync(to, body);
  }
}

function cp() {
  const [from, to] = argv.slice(2, 4);
  const source = s3(from);
  if (!argv.includes('--recursive')) {
    if (source) {
      if (!(source in state.objects)) return 1;
      copyOne(state.objects[source].body, to, state.objects[source]);
    } else {
      copyOne(fs.readFileSync(from, 'utf8'), to);
    }
    return 0;
  }
  const files = source
    ? Object.keys(state.objects)
        .filter((key) => key.startsWith(`${source}/`))
        .map((key) => [key.slice(source.length + 1), state.objects[key].body, state.objects[key]])
    : listLocal(from).map((file) => [path.relative(from, file), fs.readFileSync(file, 'utf8')]);
  files.filter(([relative]) => !excluded(relative)).forEach(([relative, body, meta]) => {
    copyOne(body, `${to}/${relative}`, meta);
  });
  return 0;
}

function run() {
  const [service, command] = argv;
  if (service === 's3' && command === 'cp') return cp();
  if (service === 's3api' && command === 'head-object') {
    return `${option('--bucket')}/${option('--key')}` in state.objects ? 0 : 254;
  }
  if (service === 'cloudfront' && command === 'create-invalidation') {
    const id = `I${(state.invalidations || []).length + 1}`;
    state.invalidations = [...(state.invalidations || []), { id, paths: option('--paths') }];
    process.stdout.write(JSON.stringify({ Invalidation: { Id: id } }));
    return 0;
  }
  if (service === 'cloudfront' && command === 'wait') return 0;
  process.stderr.write(`fake aws: unsupported ${argv.join(' ')}\n`);
  return 2;
}

const code = run();
fs.writeFileSync(statePath, JSON.stringify(state));
process.exit(code);
