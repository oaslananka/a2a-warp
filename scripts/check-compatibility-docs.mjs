import { getWorkspacePackages, readJson, readText, fail } from './check-utils.mjs';

const failures = [];

function readRequiredDoc(path) {
  try {
    return readText(path);
  } catch (error) {
    failures.push(`${path} is missing or unreadable: ${String(error)}`);
    return null;
  }
}

function requireIncludes(path, text, snippets) {
  if (text === null) return;
  for (const snippet of snippets) {
    if (!text.includes(snippet)) failures.push(`${path} missing required content: ${snippet}`);
  }
}

const canonicalPath = 'docs/compatibility.md';
const sitePath = 'docs-site/guide/compatibility.md';
const canonicalDoc = readRequiredDoc(canonicalPath);
const siteDoc = readRequiredDoc(sitePath);
const rootReadme = readRequiredDoc('README.md');
const docsIndex = readRequiredDoc('docs/index.md');
const siteIndex = readRequiredDoc('docs-site/index.md');
const siteConfig = readRequiredDoc('docs-site/.vitepress/config.mts');
const rootPackage = readJson('package.json');
const runtimeManifest = readJson('tools/runtime-versions.json');

const requiredHeadings = [
  '## Runtime Compatibility',
  '## Package Version Matrix',
  '## Protocol Version Matrix',
  '## Transport Feature Matrix',
  '## Adapter Optional Peer Ranges',
  '## Deprecation Policy',
  '## Validation Commands',
];

requireIncludes(canonicalPath, canonicalDoc, requiredHeadings);
requireIncludes(sitePath, siteDoc, requiredHeadings);

requireIncludes(canonicalPath, canonicalDoc, [
  rootPackage.engines.node,
  `pnpm ${rootPackage.engines.pnpm}`,
  runtimeManifest.node,
  runtimeManifest.nodeCompatibility[0],
  runtimeManifest.nodeCompatibility[1],
  'Jod',
  'Krypton',
  '2027-04-30',
  '2028-04-30',
  'Node 25',
  'pnpm run docs:check',
  'pnpm run docs:build',
  'pnpm run lint:md',
]);

requireIncludes(canonicalPath, canonicalDoc, [
  '`0.3`',
  '`1.0`',
  '`1.2`',
  'HTTP+JSON',
  'SSE',
  'WebSocket',
  'gRPC',
]);

const publicPackages = getWorkspacePackages()
  .filter(
    ({ dir, packageJson }) =>
      packageJson.private !== true &&
      (dir === 'cli' || dir.startsWith('packages/')) &&
      packageJson.name,
  )
  .sort((a, b) => a.packageJson.name.localeCompare(b.packageJson.name));

for (const { dir, packageJson } of publicPackages) {
  requireIncludes(canonicalPath, canonicalDoc, [
    packageJson.name,
    packageJson.version,
    packageJson.engines?.node ?? rootPackage.engines.node,
  ]);

  const readmePath = `${dir}/README.md`;
  const readme = readRequiredDoc(readmePath);
  const expectedLink =
    dir === 'cli'
      ? '[Compatibility](../docs/compatibility.md)'
      : '[Compatibility](../../docs/compatibility.md)';
  requireIncludes(readmePath, readme, [expectedLink]);

  for (const [peerName, range] of Object.entries(packageJson.peerDependencies ?? {})) {
    requireIncludes(canonicalPath, canonicalDoc, [peerName, range]);
  }
}

requireIncludes('README.md', rootReadme, ['[Compatibility](docs/compatibility.md)']);
requireIncludes('docs/index.md', docsIndex, ['[Compatibility](compatibility.md)']);
requireIncludes('docs-site/index.md', siteIndex, ['[Compatibility](guide/compatibility.md)']);
requireIncludes('docs-site/.vitepress/config.mts', siteConfig, [
  "{ text: 'Compatibility', link: '/guide/compatibility' }",
]);

requireIncludes(canonicalPath, canonicalDoc, [
  'minimum 90 days',
  'one minor release',
  'Removal conditions',
]);
requireIncludes(sitePath, siteDoc, ['minimum 90 days', 'one minor release', 'Removal conditions']);

if (failures.length > 0) fail('Compatibility documentation validation failed.', failures);
