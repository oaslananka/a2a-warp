import { readJson, readText, fail } from './check-utils.mjs';

const config = readJson('release-please-config.json');
const manifest = readJson('.release-please-manifest.json');
const failures = [];
for (const [path, releaseConfig] of Object.entries(config.packages ?? {})) {
  const name = releaseConfig?.['package-name'];
  const packageJson = readJson(`${path}/package.json`);
  if (packageJson.name !== name) failures.push(`${path}: package.json name mismatch`);
  if (manifest[path] !== packageJson.version)
    failures.push(`${path}: manifest must match package.json version ${packageJson.version}`);
  if (config.packages?.[path]?.['package-name'] !== name)
    failures.push(`${path}: release package-name mismatch`);
}
const text = JSON.stringify(config);
if (/npm_token/i.test(text)) failures.push('release-please config must not reference npm tokens');
const publishWorkflow = readText('.github/workflows/publish.yml');
const releasePleaseWorkflow = readText('.github/workflows/release-please.yml');
if (!publishWorkflow.includes('confirmation:'))
  failures.push('publish workflow must require an explicit confirmation input');
if (!publishWorkflow.includes('PUBLISH ${TAG}'))
  failures.push('publish workflow confirmation must include the resolved tag');
if (/^\s+release:\s*$/m.test(publishWorkflow) || /^\s+push:\s*$/m.test(publishWorkflow))
  failures.push('publish workflow must be owner-dispatched only');
if (!/attestations:\s*write/.test(publishWorkflow))
  failures.push('publish workflow must grant attestations: write for artifact provenance');
if (/NODE_AUTH_TOKEN|NPM_TOKEN/.test(publishWorkflow))
  failures.push('publish workflow must not use long-lived npm token authentication');
if (/fallback/i.test(publishWorkflow))
  failures.push('publish workflow must not fall back to non-provenance publishing');
if (/npm\s+dist-tag\s+add/.test(publishWorkflow))
  failures.push('publish workflow must not require token-based dist-tag mutation');
if (
  !publishWorkflow.includes(
    'actions/attest-build-provenance@a2bbfa25375fe432b6a289bc6b6cd05ecd0c4c32',
  )
)
  failures.push('publish workflow must pin actions/attest-build-provenance v4.1.0 by commit SHA');
if (!publishWorkflow.includes('pnpm run release:artifacts'))
  failures.push('publish workflow must use release:artifacts for release artifact generation');
if (!publishWorkflow.includes('pnpm run release:validate'))
  failures.push('publish workflow must validate prepared release artifacts before publish');
if (!publishWorkflow.includes('.artifacts/npm/SHA256SUMS'))
  failures.push('publish workflow must attest the npm SHA256SUMS file');
if (!publishWorkflow.includes('.artifacts/sbom/a2a-warp.cdx.json'))
  failures.push('publish workflow must attest the CycloneDX SBOM');
if (!releasePleaseWorkflow.includes('skip-github-release: true'))
  failures.push('Release Please must not create GitHub Releases');
if (
  /gh\s+release\s+create|gh\s+workflow\s+run\s+publish\.yml|git\s+tag\s|git\s+push\s+origin\s+"\$\{?tag/.test(
    releasePleaseWorkflow,
  )
)
  failures.push('Release Please workflow must not create tags, releases, or trigger publish');
if (failures.length > 0) fail('Release config validation failed.', failures);
