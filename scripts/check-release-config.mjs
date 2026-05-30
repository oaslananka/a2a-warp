import { readJson, readText, fail } from './check-utils.mjs';

const config = readJson('release-please-config.json');
const manifest = readJson('.release-please-manifest.json');
const expected = new Map([
  ['packages/core', '@oaslananka/a2a-warp'],
  ['packages/adapters', '@oaslananka/a2a-warp-adapters'],
  ['packages/registry', '@oaslananka/a2a-warp-registry'],
  ['cli', '@oaslananka/a2a-warp-cli'],
  ['packages/create-a2a-agent', 'create-a2a-warp'],
  ['packages/bridge-mcp', '@oaslananka/a2a-warp-bridge-mcp'],
  ['packages/transport-ws', '@oaslananka/a2a-warp-transport-ws'],
  ['packages/transport-grpc', '@oaslananka/a2a-warp-transport-grpc'],
  ['packages/schemas', '@oaslananka/a2a-warp-schemas'],
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
if (!/attestations:\s*write/.test(publishWorkflow))
  failures.push('publish workflow must grant attestations: write for artifact provenance');
if (
  !publishWorkflow.includes(
    'actions/attest-build-provenance@a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32',
  )
)
  failures.push('publish workflow must pin actions/attest-build-provenance v4.1.0 by commit SHA');
if (!publishWorkflow.includes('pnpm run release:artifacts'))
  failures.push('publish workflow must use release:artifacts for release artifact generation');
if (!publishWorkflow.includes('pnpm run release:validate'))
  failures.push('publish workflow must validate prepared release artifacts before publish');
if (!publishWorkflow.includes('.artifacts/npm/SHA256SUMS'))
  failures.push('publish workflow must attest the npm SHA256SUMS file');
if (!publishWorkflow.includes('.artifacts/sbom/a2a-warp.cdx.json'))
  failures.push('publish workflow must attest the CycloneDX SBOM');
if (failures.length > 0) fail('Release config validation failed.', failures);
