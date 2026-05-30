import { readText, fail } from './check-utils.mjs';

const packages = [
  ['@oaslananka/a2a-warp', 'docs/packages/core.md'],
  ['@oaslananka/a2a-warp-adapters', 'docs/packages/adapters.md'],
  ['@oaslananka/a2a-warp-registry', 'docs/packages/registry.md'],
  ['@oaslananka/a2a-warp-cli', 'docs/packages/cli.md'],
  ['@oaslananka/a2a-warp-bridge-mcp', 'docs/packages/bridge-mcp.md'],
  ['@oaslananka/a2a-warp-transport-ws', 'docs/packages/transport-ws.md'],
  ['@oaslananka/a2a-warp-transport-grpc', 'docs/packages/transport-grpc.md'],
  ['@oaslananka/a2a-warp-schemas', 'docs/packages/schemas.md'],
];
const failures = [];
const readme = readText('README.md');
for (const [pkg, path] of packages) {
  if (!readme.includes(pkg)) failures.push(`README.md: missing ${pkg}`);
  if (!readText(path).includes(pkg)) failures.push(`${path}: missing ${pkg}`);
}
if (!readme.includes('create-a2a-warp')) failures.push('README.md: missing create-a2a-warp');
if (failures.length > 0) fail('Docs/package parity validation failed.', failures);
