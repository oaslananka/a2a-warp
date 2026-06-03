import { runPnpmSync } from './check-utils.mjs';

const paths = [
  'packages/core/src',
  'packages/adapters/src',
  'packages/registry/src',
  'packages/transport-ws/src',
  'packages/transport-grpc/src',
  'packages/bridge-mcp/src',
  'packages/create-a2a-agent/src',
  'cli/src',
  'apps/demo',
  'apps/registry-ui/src',
];

const jscpdArgs = [
  'jscpd',
  '--gitignore',
  '--ignore',
  '**/node_modules/**,**/dist/**,**/coverage/**,**/test-results/**,**/tests/**,**/*.test.ts,**/*.test.tsx,**/*.spec.ts',
  '--threshold',
  '2',
  '--reporters',
  'console',
  '--noTips',
  ...paths,
];

runPnpmSync(['exec', ...jscpdArgs], { stdio: 'inherit' });
