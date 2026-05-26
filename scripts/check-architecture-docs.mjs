import { readText, fail } from './check-utils.mjs';

const failures = [];

function readRequiredDoc(path) {
  try {
    return readText(path);
  } catch (error) {
    failures.push(`${path} is missing or unreadable: ${String(error)}`);
    return '';
  }
}

const rootDoc = readRequiredDoc('ARCHITECTURE.md');
const canonicalDoc = readRequiredDoc('docs/development/architecture.md');
const siteDoc = readRequiredDoc('docs-site/guide/architecture.md');
const docsIndex = readRequiredDoc('docs/index.md');
const siteIndex = readRequiredDoc('docs-site/index.md');
const siteConfig = readRequiredDoc('docs-site/.vitepress/config.mts');

const requiredHeadings = [
  '## Layered Map',
  '## Package Responsibilities',
  '## Dependency Direction',
  '## Request Lifecycle',
  '## JSON-RPC Flow',
  '## Task Lifecycle',
  '## Storage Model',
  '## Registry Runtime',
  '## Outbound Network Policy',
  '## Auth Model',
  '## Telemetry Model',
  '## Release Flow',
  '## Workspace Graph Gate',
  '## Tests And ADRs',
];

const requiredPackages = [
  '@oaslananka/a2a-warp',
  '@oaslananka/a2a-warp-client',
  '@oaslananka/a2a-warp-registry',
  '@oaslananka/a2a-warp-adapters',
  '@oaslananka/a2a-warp-ws',
  '@oaslananka/a2a-warp-grpc',
  '@oaslananka/a2a-warp-mcp-bridge',
  '@oaslananka/a2a-warp-testing',
  '@oaslananka/a2a-warp-codex-bridge',
  'create-a2a-warp',
  '@oaslananka/a2a-warp-cli',
  'a2a-warp-demo',
  'a2a-warp-registry-ui',
  'docs-site',
  'examples/*',
];

const requiredTerms = [
  'message/send',
  'message/stream',
  'tasks/resubscribe',
  'tasks/get',
  'tasks/cancel',
  'tasks/list',
  'tasks/pushNotification/set',
  'tasks/pushNotification/get',
  'SUBMITTED',
  'QUEUED',
  'WORKING',
  'INPUT_REQUIRED',
  'WAITING_ON_EXTERNAL',
  'COMPLETED',
  'FAILED',
  'CANCELED',
  'InMemoryTaskStorage',
  'SqliteTaskStorage',
  'AsyncTaskStorage',
  'InMemoryStorage',
  'RedisStorage',
  'JwtAuthMiddleware',
  'RuntimeMetrics',
  'Release Please',
  'Trusted Publishing/OIDC',
];

for (const heading of requiredHeadings) {
  if (!canonicalDoc.includes(heading)) {
    failures.push(`docs/development/architecture.md missing heading: ${heading}`);
  }
}

for (const packageName of requiredPackages) {
  if (!canonicalDoc.includes(packageName)) {
    failures.push(`docs/development/architecture.md missing package reference: ${packageName}`);
  }
}

for (const term of requiredTerms) {
  if (!canonicalDoc.includes(term)) {
    failures.push(`docs/development/architecture.md missing architecture term: ${term}`);
  }
}

const mermaidFenceCount = (canonicalDoc.match(/```mermaid/g) ?? []).length;
if (mermaidFenceCount < 3) {
  failures.push('docs/development/architecture.md must include at least 3 Mermaid diagrams');
}

const requiredLinks = [
  '../architecture/adr/index.md',
  '../../tests/integration/client-server.test.ts',
  '../../tests/transport-contract/transportContract.ts',
  '../../packages/core/tests/properties/task-lifecycle.property.test.ts',
  '../../packages/core/tests/telemetry-snapshots.test.ts',
  '../../tests/integration/release-artifacts.test.ts',
];

for (const link of requiredLinks) {
  if (!canonicalDoc.includes(link)) {
    failures.push(`docs/development/architecture.md missing link: ${link}`);
  }
}

const summarySnippet = [
  'Workspace graph validation passed.',
  'Checked 10 public package import aliases across 32 forbidden dependency edges.',
  'Dependency direction: types/schemas -> core runtime -> transports -> client/registry -> adapters/bridges -> CLI/apps.',
];

for (const line of summarySnippet) {
  if (!canonicalDoc.includes(line)) {
    failures.push(`docs/development/architecture.md missing workspace graph snippet line: ${line}`);
  }
}

if (rootDoc.length < 1500) {
  failures.push('ARCHITECTURE.md must be expanded beyond a pointer stub');
}
for (const term of ['Layered Map', 'Dependency Direction', 'Runtime Flows', 'Verification']) {
  if (!rootDoc.includes(term)) {
    failures.push(`ARCHITECTURE.md missing summary section: ${term}`);
  }
}

if (!docsIndex.includes('development/architecture.md')) {
  failures.push('docs/index.md must link to architecture docs');
}
if (!siteIndex.includes('guide/architecture.md')) {
  failures.push('docs-site/index.md must link to architecture docs');
}
if (!siteConfig.includes("{ text: 'Architecture', link: '/guide/architecture' }")) {
  failures.push('docs-site sidebar must link to guide architecture page');
}
if (!siteDoc.includes('docs/development/architecture.md') || !siteDoc.includes('Workspace graph')) {
  failures.push('docs-site/guide/architecture.md must mirror the canonical architecture topic');
}

if (failures.length > 0) fail('Architecture documentation validation failed.', failures);
