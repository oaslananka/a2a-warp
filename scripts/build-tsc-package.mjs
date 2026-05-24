import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';

const require = createRequire(import.meta.url);

function generateCliVersionModule() {
  if (basename(process.cwd()) !== 'cli') return;

  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const version = packageJson.version;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('cli/package.json must define a version string');
  }

  const generatedDir = resolve('src/generated');
  const escapedVersion = version.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(
    resolve(generatedDir, 'version.ts'),
    `// This file is written by scripts/build-tsc-package.mjs from cli/package.json.\nexport const generatedCliVersion = '${escapedVersion}';\n`,
  );
}

generateCliVersionModule();
rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-b', '--force'], {
  stdio: 'inherit',
});
