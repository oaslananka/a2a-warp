import { execFileSync } from 'node:child_process';
import { getWorkspacePackages, fail } from './check-utils.mjs';

const failures = [];
const pnpmExecPath = process.env.npm_execpath;
for (const entry of getWorkspacePackages().filter(
  (entry) => entry.packageJson.private !== true && entry.path !== 'package.json',
)) {
  try {
    const output = pnpmExecPath
      ? execFileSync(process.execPath, [pnpmExecPath, '--dir', entry.dir, 'pack', '--dry-run'], {
          encoding: 'utf8',
          stdio: 'pipe',
        })
      : execFileSync('pnpm', ['--dir', entry.dir, 'pack', '--dry-run'], {
          encoding: 'utf8',
          stdio: 'pipe',
          shell: process.platform === 'win32',
        });
    if (!output.includes('package.json'))
      failures.push(`${entry.dir}: dry-run output did not list package.json`);
    if (/node_modules|coverage|test-results|\.env|\.tsbuildinfo/.test(output))
      failures.push(`${entry.dir}: dry-run output includes forbidden artifact`);
  } catch (error) {
    failures.push(`${entry.dir}: pnpm pack --dry-run failed with ${error.status ?? 'unknown'}`);
  }
}
if (failures.length > 0) fail('npm pack dry-run validation failed.', failures);
