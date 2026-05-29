import { readJson, fail } from './check-utils.mjs';

const inventories = [
  ['packages/core/package.json', 'packages/core/public-surface.json'],
  ['packages/registry/package.json', 'packages/registry/public-surface.json'],
  ['packages/adapters/package.json', 'packages/adapters/public-surface.json'],
  ['packages/ws/package.json', 'packages/ws/public-surface.json'],
  ['packages/mcp-bridge/package.json', 'packages/mcp-bridge/public-surface.json'],
  ['packages/schemas/package.json', 'packages/schemas/public-surface.json'],
];
const failures = [];
for (const [pkgPath, inventoryPath] of inventories) {
  const pkg = readJson(pkgPath);
  const inventory = readJson(inventoryPath);
  const actual = Object.keys(pkg.exports ?? {}).sort();
  const expected = [...inventory.exports].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    failures.push(
      `${pkgPath}: exports ${JSON.stringify(actual)} do not match ${inventoryPath} ${JSON.stringify(expected)}`,
    );
}
if (failures.length > 0) fail('Public surface validation failed.', failures);
