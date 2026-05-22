import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';

const require = createRequire(import.meta.url);

rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-b', '--force'], {
  stdio: 'inherit',
});
