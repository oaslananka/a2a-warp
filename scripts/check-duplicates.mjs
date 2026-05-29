import { execFileSync } from 'node:child_process';

const paths = [
  'packages/core/src',
  'packages/adapters/src',
  'packages/registry/src',
  'packages/ws/src',
  'packages/grpc/src',
  'packages/mcp-bridge/src',
  'packages/create-a2a-agent/src',
  'cli/src',
  'apps/demo',
  'apps/registry-ui/src',
];

const jscpdArgs = [
  'jscpd',
  '--gitignore',
  '--ignore',
  '**/node_modules/**,**/dist/**,**/coverage/**,**/test-results/**,**/tests/**,**/*.test.ts,**/*.spec.ts',
  '--threshold',
  '2',
  '--reporters',
  'console',
  '--noTips',
  ...paths,
];

const pnpmExecPath = process.env.npm_execpath;
if (pnpmExecPath) {
  execFileSync(process.execPath, [pnpmExecPath, 'exec', ...jscpdArgs], { stdio: 'inherit' });
} else {
  execFileSync('pnpm', ['exec', ...jscpdArgs], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}
