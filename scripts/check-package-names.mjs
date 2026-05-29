import { getWorkspacePackages, fail, readJson } from './check-utils.mjs';

const manifest = readJson('.release-please-manifest.json');

const expected = new Map([
  ['package.json', { name: 'a2a-warp-workspace', version: '1.0.0', private: true }],
  ['apps/demo/package.json', { name: 'a2a-warp-demo', version: '1.0.0', private: true }],
  [
    'apps/registry-ui/package.json',
    { name: 'a2a-warp-registry-ui', version: '1.0.0', private: true },
  ],
  ['docs-site/package.json', { name: 'a2a-warp-docs-site', version: '1.0.0', private: true }],
  [
    'packages/core/package.json',
    { name: '@oaslananka/a2a-warp', version: manifest['packages/core'] },
  ],
  [
    'packages/adapters/package.json',
    { name: '@oaslananka/a2a-warp-adapters', version: manifest['packages/adapters'] },
  ],
  [
    'packages/registry/package.json',
    { name: '@oaslananka/a2a-warp-registry', version: manifest['packages/registry'] },
  ],
  ['cli/package.json', { name: '@oaslananka/a2a-warp-cli', version: manifest.cli }],
  [
    'packages/create-a2a-agent/package.json',
    { name: 'create-a2a-warp', version: manifest['packages/create-a2a-agent'] },
  ],
  [
    'packages/mcp-bridge/package.json',
    { name: '@oaslananka/a2a-warp-mcp-bridge', version: manifest['packages/mcp-bridge'] },
  ],
  [
    'packages/ws/package.json',
    { name: '@oaslananka/a2a-warp-ws', version: manifest['packages/ws'] },
  ],
  [
    'packages/grpc/package.json',
    { name: '@oaslananka/a2a-warp-grpc', version: manifest['packages/grpc'] },
  ],
  [
    'packages/schemas/package.json',
    { name: '@oaslananka/a2a-warp-schemas', version: manifest['packages/schemas'] },
  ],
]);
const localNames = new Set([...expected.values()].map((entry) => entry.name));
const packages = getWorkspacePackages();
const failures = [];
for (const [path, rule] of expected) {
  const found = packages.find((entry) => entry.path === path)?.packageJson;
  if (!found) {
    failures.push(`${path}: missing`);
    continue;
  }
  if (found.name !== rule.name)
    failures.push(`${path}: expected name ${rule.name}, found ${found.name}`);
  if (found.version !== rule.version)
    failures.push(`${path}: expected version ${rule.version}, found ${found.version}`);
  if (rule.private === true && found.private !== true)
    failures.push(`${path}: expected private true`);
  if (!rule.private && found.private === true)
    failures.push(`${path}: publishable package must not be private`);
  for (const block of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const depName of Object.keys(found[block] ?? {})) {
      if (/a2a-mesh/i.test(depName)) failures.push(`${path}: stale dependency ${depName}`);
      if (/^a2a-warp/.test(depName) && !localNames.has(depName))
        failures.push(`${path}: local dependency ${depName} must use canonical scoped name`);
    }
  }
}
if (failures.length > 0) fail('Package name validation failed.', failures);
