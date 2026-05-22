import { readJson, readText, fail } from './check-utils.mjs';

const config = readJson('release-please-config.json');
const manifest = readJson('.release-please-manifest.json');
const expected = new Map([
  ['packages/core', '@oaslananka/a2a-warp'],
  ['packages/client', '@oaslananka/a2a-warp-client'],
  ['packages/adapters', '@oaslananka/a2a-warp-adapters'],
  ['packages/registry', '@oaslananka/a2a-warp-registry'],
  ['cli', '@oaslananka/a2a-warp-cli'],
  ['packages/create-a2a-agent', 'create-a2a-warp'],
  ['packages/mcp-bridge', '@oaslananka/a2a-warp-mcp-bridge'],
  ['packages/ws', '@oaslananka/a2a-warp-ws'],
  ['packages/grpc', '@oaslananka/a2a-warp-grpc'],
  ['packages/testing', '@oaslananka/a2a-warp-testing'],
  ['packages/codex-bridge', '@oaslananka/a2a-warp-codex-bridge'],
]);
const failures = [];
for (const [path, name] of expected) {
  const packageJson = readJson(`${path}/package.json`);
  if (packageJson.name !== name) failures.push(`${path}: package.json name mismatch`);
  if (manifest[path] !== packageJson.version)
    failures.push(`${path}: manifest must match package.json version ${packageJson.version}`);
  if (config.packages?.[path]?.['package-name'] !== name)
    failures.push(`${path}: release package-name mismatch`);
}
const text = JSON.stringify(config);
if (/npm_token/i.test(text)) failures.push('release-please config must not reference npm tokens');
const publishWorkflow = readText('.github/workflows/publish.yml');
if (publishWorkflow.includes('A2A-WARP-1.0.0'))
  failures.push('publish workflow confirmation must not pin a stale package version');
if (failures.length > 0) fail('Release config validation failed.', failures);
