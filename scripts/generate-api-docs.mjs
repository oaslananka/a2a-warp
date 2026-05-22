import { execFileSync } from 'node:child_process';

execFileSync('pnpm', ['run', 'docs:api'], { stdio: 'inherit' });
