import { execFileSync } from 'node:child_process';
import { fail } from './check-utils.mjs';

const names = [
  '@oaslananka/a2a-warp',
  '@oaslananka/a2a-warp-client',
  '@oaslananka/a2a-warp-adapters',
  '@oaslananka/a2a-warp-registry',
  '@oaslananka/a2a-warp-cli',
  '@oaslananka/a2a-warp-mcp-bridge',
  '@oaslananka/a2a-warp-ws',
  '@oaslananka/a2a-warp-grpc',
  '@oaslananka/a2a-warp-testing',
  '@oaslananka/a2a-warp-codex-bridge',
  'create-a2a-warp',
];
const failures = [];
for (const name of names) {
  try {
    execFileSync('npm', ['view', name, 'name', '--json'], { stdio: 'pipe', encoding: 'utf8' });
    if (!name.startsWith('@oaslananka/')) {
      const owners = execFileSync('npm', ['owner', 'ls', name], {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      if (!/oaslananka\s*</.test(owners))
        failures.push(`${name}: exact npm package exists outside oaslananka ownership`);
    }
  } catch {
    // npm 404 means available or not found.
  }
}
try {
  const repo = execFileSync(
    'gh',
    ['repo', 'view', 'oaslananka/a2a-warp', '--json', 'nameWithOwner'],
    { stdio: 'pipe', encoding: 'utf8' },
  );
  if (!repo.includes('oaslananka/a2a-warp'))
    failures.push('GitHub repo exact match is not oaslananka/a2a-warp');
} catch {
  // Missing gh auth or repository availability is handled by remote bootstrap checks.
}
if (failures.length > 0) fail('Name collision validation failed.', failures);
