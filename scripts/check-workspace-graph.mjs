import { listFiles, readText, fail } from './check-utils.mjs';

const printSummary = process.argv.includes('--summary');
const packageByImport = new Map([
  ['@oaslananka/a2a-warp', 'core'],
  ['@oaslananka/a2a-warp-adapters', 'adapters'],
  ['@oaslananka/a2a-warp-registry', 'registry'],
  ['@oaslananka/a2a-warp-cli', 'cli'],
  ['@oaslananka/a2a-warp-bridge-mcp', 'mcp-bridge'],
  ['@oaslananka/a2a-warp-transport-ws', 'ws'],
  ['@oaslananka/a2a-warp-transport-grpc', 'grpc'],
  ['@oaslananka/a2a-warp-schemas', 'schemas'],
]);
const disallowed = {
  core: new Set(['adapters', 'registry', 'cli', 'mcp-bridge', 'ws', 'grpc', 'schemas']),
  registry: new Set(['adapters', 'cli', 'mcp-bridge', 'schemas']),
  adapters: new Set(['registry', 'cli', 'mcp-bridge', 'schemas']),
  'mcp-bridge': new Set(['registry', 'adapters', 'cli', 'schemas']),
  schemas: new Set(['core', 'adapters', 'registry', 'cli', 'mcp-bridge', 'ws', 'grpc']),
};
function ownerForFile(file) {
  if (file.startsWith('packages/core/')) return 'core';
  if (file.startsWith('packages/adapters/')) return 'adapters';
  if (file.startsWith('packages/registry/')) return 'registry';
  if (file.startsWith('packages/bridge-mcp/')) return 'mcp-bridge';
  if (file.startsWith('packages/transport-ws/')) return 'ws';
  if (file.startsWith('packages/transport-grpc/')) return 'grpc';
  if (file.startsWith('packages/schemas/')) return 'schemas';
  if (file.startsWith('cli/')) return 'cli';
  return undefined;
}
const failures = [];
for (const file of listFiles().filter((file) => /\.(ts|tsx|mts|mjs|js)$/.test(file))) {
  const owner = ownerForFile(file);
  if (!owner) continue;
  const text = readText(file);
  for (const [specifier, target] of packageByImport) {
    if (text.includes(`'${specifier}'`) || text.includes(`"${specifier}"`)) {
      if (disallowed[owner]?.has(target))
        failures.push(`${file}: ${owner} must not import ${target}`);
    }
  }
}
if (failures.length > 0) fail('Workspace graph validation failed.', failures);

if (printSummary && failures.length === 0) {
  const disallowedEdgeCount = Object.values(disallowed).reduce(
    (total, targets) => total + targets.size,
    0,
  );
  console.log('Workspace graph validation passed.');
  console.log(
    `Checked ${packageByImport.size} public package import aliases across ${disallowedEdgeCount} forbidden dependency edges.`,
  );
  console.log(
    'Dependency direction: types/schemas -> core runtime -> transports -> client/registry -> adapters/bridges -> CLI/apps.',
  );
}
