/**
 * @file run-consumer-smoke.mjs
 *
 * Consumer smoke test matrix runner.
 *
 * Builds the monorepo, packs all publishable packages into tarballs,
 * creates a fresh temporary project outside the monorepo, installs
 * from the tarballs, and exercises every consumer surface:
 *
 *   1. Server     – start A2AServer, send sendTask JSON-RPC, verify response
 *   2. Client     – import & instantiate A2AClient
 *   3. Registry   – start registry server, register & query agents
 *   4. CLI        – a2a-warp --version, --help, agent validate --help
 *   5. Scaffolder – create-a2a-warp, verify output structure
 *   6. WS         – load @oaslananka/a2a-warp-transport-ws module
 *   7. gRPC       – load @oaslananka/a2a-warp-transport-grpc module
 *   8. MCP bridge – load @oaslananka/a2a-warp-bridge-mcp module
 *
 * Each failure identifies which package and which surface.
 * Exit code = number of failed surfaces (0 = all pass).
 */

import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

/* ───────── helpers ───────── */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf-8', ...opts });
}

function getFreePort() {
  return new Promise((resolve_, reject_) => {
    const srv = createServer();
    srv.listen(0, () => {
      const port = srv.address().port;
      srv.close(() => resolve_(port));
    });
    srv.on('error', reject_);
  });
}

function now() {
  return new Date().toISOString().slice(11, 19);
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

/* ───────── package inventory ───────── */

const PACKAGES = [
  { name: '@oaslananka/a2a-warp-core', dir: 'packages/core-types' },
  { name: '@oaslananka/a2a-warp-auth', dir: 'packages/auth' },
  { name: '@oaslananka/a2a-warp-telemetry', dir: 'packages/telemetry' },
  { name: '@oaslananka/a2a-warp-schemas', dir: 'packages/schemas' },
  { name: '@oaslananka/a2a-warp', dir: 'packages/core' },
  { name: '@oaslananka/a2a-warp-registry', dir: 'packages/registry' },
  { name: '@oaslananka/a2a-warp-cli', dir: 'cli' },
  { name: 'create-a2a-warp', dir: 'packages/create-a2a-agent' },
  { name: '@oaslananka/a2a-warp-transport-ws', dir: 'packages/transport-ws' },
  { name: '@oaslananka/a2a-warp-transport-grpc', dir: 'packages/transport-grpc' },
  { name: '@oaslananka/a2a-warp-bridge-mcp', dir: 'packages/bridge-mcp' },
];

/* ───────── step 1: build monorepo ───────── */

console.log(`[${now()}] === [consumer-smoke] Build monorepo ===`);
run('pnpm', ['run', 'build'], { cwd: root });

/* ───────── step 2: pack all packages ───────── */

console.log(`[${now()}] === [consumer-smoke] Pack packages ===`);
const tmpPackDir = mkdtempSync(join(tmpdir(), 'a2a-consumer-pack-'));
const tarballs = {};

for (const pkg of PACKAGES) {
  const pkgDir = join(root, pkg.dir);
  const pkgJson = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf-8'));
  const version = pkgJson.version;
  run('pnpm', ['pack', '--pack-destination', tmpPackDir], { cwd: pkgDir });
  // pnpm pack produces: <scope-without-@>-<name>-<version>.tgz
  const fileName = pkg.name.startsWith('@')
    ? `${pkg.name.slice(1).replace('/', '-')}-${version}.tgz`
    : `${pkg.name}-${version}.tgz`;
  const tgz = join(tmpPackDir, fileName);
  tarballs[pkg.name] = tgz;
  console.log(`  packed ${pkg.name} → ${fileName}`);
}

/* ───────── step 3: create temp project ───────── */

console.log(`[${now()}] === [consumer-smoke] Create temp project ===`);
const tempDir = mkdtempSync(join(tmpdir(), 'a2a-consumer-test-'));

// Write .npmrc to auto-install peer deps (ws is a peer of transport-ws)
writeFileSync(join(tempDir, '.npmrc'), 'auto-install-peers=true\n');

const deps = {};
for (const [name, tgzPath] of Object.entries(tarballs)) {
  deps[name] = `file:${tgzPath}`;
}
writeFileSync(
  join(tempDir, 'package.json'),
  JSON.stringify(
    {
      name: 'a2a-consumer-smoke',
      version: '0.0.0',
      private: true,
      type: 'module',
      dependencies: deps,
    },
    null,
    2,
  ),
);

console.log(`  installing in ${tempDir}`);
run('pnpm', ['install', '--no-frozen-lockfile'], { cwd: tempDir, timeout: 120000 });
console.log('  install complete');

/* ───────── step 4: run smoke surfaces ───────── */

const results = [];
let testIndex = 0;

async function surf(name, code) {
  testIndex++;
  const file = `test-${testIndex}.mjs`;
  const fullCode = [
    'import assert from "node:assert";',
    'import { describe, it } from "node:test";',
    code,
  ].join('\n');
  writeFileSync(join(tempDir, file), fullCode);

  process.stdout.write(`  [smoke] ${name} ... `);
  try {
    run(process.execPath, ['--test', file], { cwd: tempDir, timeout: 30000 });
    console.log(`${GREEN}PASS${RESET}`);
    results.push({ name, pass: true });
  } catch (err) {
    console.log(`${RED}FAIL${RESET}`);
    const lines = (err.stderr || err.message || '').split('\n');
    const msg =
      lines
        .filter((l) => l.includes('throw') || l.includes('Error:') || l.includes('AssertionError'))
        .slice(-3)
        .join('\n')
        .trim() || lines.slice(-2).join('\n').trim();
    console.error(`    ${msg}`);
    results.push({ name, pass: false, error: msg });
  }
}

// ── Surface 1: Server ────────────────────────────────────────────
const srvPort = await getFreePort();
await surf(
  'server / A2AServer JSON-RPC sendTask',
  `
  const http = await import('node:http');
  const { A2AServer } = await import('@oaslananka/a2a-warp');
  const host = '127.0.0.1';
  const server = new A2AServer({});
  await server.start(${srvPort}, host);

  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tasks/send',
    params: { id: 'srv-' + Date.now(), message: { role: 'user', parts: [{ type: 'text', text: 'Hello' }] } },
  });
  const resp = await fetch('http://' + host + ':' + ${srvPort} + '/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await resp.json();
  await server.stop();

  assert.ok(data, 'No JSON-RPC response');
  assert.strictEqual(data.jsonrpc, '2.0', 'Not JSON-RPC 2.0');
  assert.ok(data.result, 'No result');
  assert.ok(data.result.id, 'No task id');
  assert.ok(String(data.result.id).startsWith('srv-'), 'Unexpected task id: ' + data.result.id);
`,
);

// ── Surface 2: Client ────────────────────────────────────────────
const cliPort = await getFreePort();
await surf(
  'client / A2AClient sendTask',
  `
  const http = await import('node:http');
  const { A2AServer, A2AClient } = await import('@oaslananka/a2a-warp');
  const host = '127.0.0.1';
  const srv = new A2AServer({});
  await srv.start(${cliPort}, host);

  const client = new A2AClient({ baseUrl: 'http://' + host + ':' + ${cliPort} + '/' });
  const result = await client.sendTask({
    id: 'cli-' + Date.now(),
    message: { role: 'user', parts: [{ type: 'text', text: 'ping' }] },
  });
  await srv.stop();

  assert.ok(result, 'No result from client');
  assert.ok(result.id, 'No task id');
  assert.ok(String(result.id).startsWith('cli-'), 'Unexpected task id');
`,
);

// ── Surface 3: Registry ──────────────────────────────────────────
const regPort = await getFreePort();
await surf(
  'registry / RegistryServer agents API',
  `
  const http = await import('node:http');
  const { RegistryServer } = await import('@oaslananka/a2a-warp-registry');
  const srv = new RegistryServer({});
  await srv.start(${regPort});

  const agent = { name: 'smoke-test', description: 'test', url: 'http://localhost:9999', capabilities: { skills: ['smoke'] } };
  const reg = await fetch('http://127.0.0.1:' + ${regPort} + '/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });
  assert.ok(reg.ok, 'Register failed: ' + reg.status);

  const q = await fetch('http://127.0.0.1:' + ${regPort} + '/agents?capability=smoke');
  const list = await q.json();
  assert.ok(Array.isArray(list), 'Agent list not array');
  assert.ok(list.length > 0, 'No agents found');

  const h = await fetch('http://127.0.0.1:' + ${regPort} + '/health');
  assert.ok(h.ok, 'Health check failed: ' + h.status);
  await srv.stop();
`,
);

// ── Surface 4: CLI ───────────────────────────────────────────────
await surf(
  'cli / a2a-warp commands',
  `
  import { execFileSync } from 'node:child_process';
  import { fileURLToPath } from 'node:url';
  import { join } from 'node:path';

  const root = fileURLToPath(new URL('.', import.meta.url));
  const binDir = join(root, 'node_modules', '.bin');
  const bin = join(binDir, process.platform === 'win32' ? 'a2a-warp.cmd' : 'a2a-warp');

  const version = execFileSync(bin, ['--version'], { encoding: 'utf-8' }).trim();
  assert.ok(version, 'No version output');

  const help = execFileSync(bin, ['--help'], { encoding: 'utf-8' });
  assert.ok(help.includes('Usage') || help.includes('Commands'), 'Help missing expected content');

  const validateHelp = execFileSync(bin, ['agent', 'validate', '--help'], { encoding: 'utf-8', timeout: 10000 });
  assert.ok(validateHelp, 'agent validate --help produced no output');
`,
);

// ── Surface 5: Scaffolder ────────────────────────────────────────
const scaffDir = join(tempDir, 'scaff-test');
await surf(
  'scaffolder / create-a2a-warp scaffolding',
  `
  import { execFileSync } from 'node:child_process';
  import { existsSync, readFileSync } from 'node:fs';
  import { fileURLToPath } from 'node:url';
  import { join } from 'node:path';

  const root = fileURLToPath(new URL('.', import.meta.url));
  const binDir = join(root, 'node_modules', '.bin');
  const bin = join(binDir, process.platform === 'win32' ? 'create-a2a-warp.cmd' : 'create-a2a-warp');
  const outDir = '${scaffDir.replace(/\\/g, '\\\\')}';
  execFileSync(bin, [outDir], { timeout: 30000 });

  assert.ok(existsSync(outDir + '/package.json'), 'package.json not created');
  const pj = JSON.parse(readFileSync(outDir + '/package.json', 'utf-8'));
  assert.ok(pj.name, 'Scaffolded project has no name');
  assert.ok(existsSync(outDir + '/src/index.ts') || existsSync(outDir + '/src/index.js'), 'src/index not created');
`,
);

// ── Surface 6: WS module load ────────────────────────────────────
await surf(
  'transport-ws / module loads and exports',
  `
  const mod = await import('@oaslananka/a2a-warp-transport-ws');
  assert.ok(mod.WsServer, 'Missing WsServer export');
  assert.ok(mod.WsClient, 'Missing WsClient export');
`,
);

// ── Surface 7: gRPC module load ──────────────────────────────────
await surf(
  'transport-grpc / module loads and exports',
  `
  const mod = await import('@oaslananka/a2a-warp-transport-grpc');
  assert.ok(mod.GrpcServer, 'Missing GrpcServer export');
  assert.ok(mod.GrpcClient, 'Missing GrpcClient export');
`,
);

// ── Surface 8: MCP bridge module load ────────────────────────────
await surf(
  'bridge-mcp / module loads and exports',
  `
  const mod = await import('@oaslananka/a2a-warp-bridge-mcp');
  assert.ok(mod.A2ATool, 'Missing A2ATool export');
  assert.ok(mod.McpToolSkill, 'Missing McpToolSkill export');
`,
);

/* ───────── summary ───────── */

console.log(`\n[${now()}] === [consumer-smoke] Results ===`);
let passed = 0;
let failed = 0;
for (const r of results) {
  const icon = r.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  console.log(`  ${icon} ${r.name}`);
  if (r.pass) passed++;
  else failed++;
}

const total = results.length;
console.log(`\n  ${passed}/${total} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error('Consumer smoke test FAILURES detected.');
  process.exit(1);
}
