import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { generateSbom } from './generate-sbom.mjs';

const execFileAsync = promisify(execFile);
const artifactDir = '.artifacts';
const npmArtifactDir = '.artifacts/npm';
const pnpmExecPath = process.env.npm_execpath;

async function runPnpm(args) {
  if (pnpmExecPath) {
    await execFileAsync(process.execPath, [pnpmExecPath, ...args], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return;
  }

  await execFileAsync('pnpm', args, {
    maxBuffer: 10 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
}

async function listTarballs(dir) {
  const entries = await readdir(dir);
  return entries.filter((entry) => entry.endsWith('.tgz')).sort();
}

async function writeChecksums(dir) {
  const tarballs = await listTarballs(dir);
  if (tarballs.length === 0) {
    throw new Error(`${dir} must contain release package tarballs before checksums are written`);
  }

  const lines = [];
  for (const tarball of tarballs) {
    const content = await readFile(join(dir, tarball));
    const hash = createHash('sha256').update(content).digest('hex');
    lines.push(`${hash}  ${tarball}`);
  }
  await writeFile(join(dir, 'SHA256SUMS'), `${lines.join('\n')}\n`);
}

await rm(artifactDir, { force: true, recursive: true });
await mkdir(npmArtifactDir, { recursive: true });
await runPnpm([
  '-r',
  '--filter',
  './packages/*',
  '--filter',
  './cli',
  'pack',
  '--pack-destination',
  npmArtifactDir,
]);
await writeChecksums(npmArtifactDir);
await generateSbom();
