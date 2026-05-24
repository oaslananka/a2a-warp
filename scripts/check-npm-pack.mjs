import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getWorkspacePackages, fail } from './check-utils.mjs';

const failures = [];
const pnpmExecPath = process.env.npm_execpath;

function runPnpm(args, options = {}) {
  if (pnpmExecPath) {
    return execFileSync(process.execPath, [pnpmExecPath, ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options,
    });
  }

  return execFileSync('pnpm', args, {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: process.platform === 'win32',
    ...options,
  });
}

function formatError(error) {
  if (!(error instanceof Error)) return String(error);
  const status = 'status' in error ? ` status ${error.status ?? 'unknown'}` : '';
  const stderr =
    'stderr' in error && Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8').trim() : '';
  return stderr ? `${error.message}${status}: ${stderr}` : `${error.message}${status}`;
}

for (const entry of getWorkspacePackages().filter(
  (entry) => entry.packageJson.private !== true && entry.path !== 'package.json',
)) {
  try {
    const output = runPnpm(['--dir', entry.dir, 'pack', '--dry-run']);
    if (!output.includes('package.json'))
      failures.push(`${entry.dir}: dry-run output did not list package.json`);
    if (/node_modules|coverage|test-results|\.env|\.tsbuildinfo/.test(output))
      failures.push(`${entry.dir}: dry-run output includes forbidden artifact`);
  } catch (error) {
    failures.push(`${entry.dir}: pnpm pack --dry-run failed: ${formatError(error)}`);
  }
}

function parsePackFilename(output) {
  const payload = JSON.parse(output);
  const packResult = Array.isArray(payload) ? payload[0] : payload;
  if (typeof packResult?.filename !== 'string') {
    throw new Error('pnpm pack --json did not report a tarball filename');
  }
  return packResult.filename;
}

function smokePackedCli() {
  const tempDir = mkdtempSync(join(process.cwd(), 'cli', '.pack-smoke-'));
  const extractDir = join(tempDir, 'extract');
  mkdirSync(extractDir);

  try {
    const packOutput = runPnpm(['--dir', 'cli', 'pack', '--json', '--pack-destination', tempDir]);
    const tarball = parsePackFilename(packOutput);
    execFileSync('tar', ['-xzf', tarball, '-C', extractDir], {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    const packageDir = join(extractDir, 'package');
    const stdout = execFileSync(
      process.execPath,
      [join(packageDir, 'bin', 'a2a-warp.js'), 'doctor', '--json'],
      {
        cwd: packageDir,
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );
    const payload = JSON.parse(stdout);
    if (payload.cli !== 'a2a-warp') {
      failures.push(`cli: packed binary reported unexpected cli value ${String(payload.cli)}`);
    }
    if (typeof payload.version !== 'string' || payload.version.length === 0) {
      failures.push('cli: packed binary did not report a version');
    }
  } catch (error) {
    failures.push(`cli: packed binary smoke failed: ${formatError(error)}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

smokePackedCli();

if (failures.length > 0) fail('npm pack dry-run validation failed.', failures);
