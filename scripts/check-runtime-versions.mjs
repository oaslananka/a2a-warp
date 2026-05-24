import { writeFileSync } from 'node:fs';
import { readJson, readText, fail } from './check-utils.mjs';

const write = process.argv.includes('--write');
const manifestPath = 'tools/runtime-versions.json';
const semverPattern = /^\d+\.\d+\.\d+$/;
const failures = [];

function readRuntimeManifest() {
  try {
    return readJson(manifestPath);
  } catch (error) {
    fail('Runtime version manifest is missing or invalid.', [
      `${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    ]);
    process.exit(1);
  }
}

function validateRuntimeManifest(manifest) {
  const expectedKeys = ['node', 'nodeCompatibility', 'pnpm', 'npmForPublish'];
  for (const key of expectedKeys) {
    if (!(key in manifest)) failures.push(`${manifestPath}: missing ${key}`);
  }

  if (typeof manifest.node !== 'string' || !semverPattern.test(manifest.node)) {
    failures.push(`${manifestPath}: node must be an exact semver string without a v prefix`);
  }
  if (!Array.isArray(manifest.nodeCompatibility) || manifest.nodeCompatibility.length === 0) {
    failures.push(`${manifestPath}: nodeCompatibility must be a non-empty array`);
  } else {
    for (const version of manifest.nodeCompatibility) {
      if (typeof version !== 'string' || !semverPattern.test(version)) {
        failures.push(
          `${manifestPath}: nodeCompatibility entries must be exact semver strings without v prefixes`,
        );
      }
    }
    if (!manifest.nodeCompatibility.includes(manifest.node)) {
      failures.push(`${manifestPath}: nodeCompatibility must include node`);
    }
  }
  if (typeof manifest.pnpm !== 'string' || !semverPattern.test(manifest.pnpm)) {
    failures.push(`${manifestPath}: pnpm must be an exact semver string`);
  }
  if (typeof manifest.npmForPublish !== 'string' || !semverPattern.test(manifest.npmForPublish)) {
    failures.push(`${manifestPath}: npmForPublish must be an exact semver string`);
  }
}

function normalizeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeOrExpect(path, actual, expected) {
  if (actual === expected) return;
  if (write) {
    writeFileSync(path, expected);
    return;
  }
  failures.push(`${path}: does not match ${manifestPath}`);
}

function syncTextFile(path, expected) {
  writeOrExpect(path, readText(path), expected);
}

function syncPackageJson(path, update) {
  const packageJson = readJson(path);
  const updated = update(structuredClone(packageJson));
  writeOrExpect(path, normalizeJson(packageJson), normalizeJson(updated));
}

function syncWorkflowEnv(path, manifest) {
  const original = readText(path);
  let updated = original.replace(/NODE_VERSION:\s*'[^']+'/g, `NODE_VERSION: '${manifest.node}'`);
  if (path === '.github/workflows/ci.yml') {
    const compatibilityMinimum = manifest.nodeCompatibility.find(
      (version) => version !== manifest.node,
    );
    if (compatibilityMinimum) {
      updated = updated.replace(/node:\s*'22\.\d+\.\d+'/g, `node: '${compatibilityMinimum}'`);
    }
    updated = updated.replace(/node:\s*'24\.\d+\.\d+'/g, `node: '${manifest.node}'`);
  }
  if (path === '.github/workflows/publish.yml') {
    updated = updated.replace(
      /NPM_VERSION:\s*'[^']+'/g,
      `NPM_VERSION: '${manifest.npmForPublish}'`,
    );
  }
  writeOrExpect(path, original, updated);
}

function syncScaffoldPackageManager(manifest) {
  const path = 'cli/src/commands/scaffold.ts';
  const original = readText(path);
  const updated = original.replace(
    /packageManager:\s*'pnpm@[^']+'/,
    `packageManager: 'pnpm@${manifest.pnpm}'`,
  );
  writeOrExpect(path, original, updated);
}

function syncCompatibilityContexts(manifest) {
  const compatibilityMinimum = manifest.nodeCompatibility.find(
    (version) => version !== manifest.node,
  );
  if (!compatibilityMinimum) return;
  for (const path of ['.github/rulesets/main.json', 'docs/release/branch-protection.md']) {
    const original = readText(path);
    const updated = original
      .replace(/node 22\.\d+\.\d+/g, `node ${compatibilityMinimum}`)
      .replace(/node 24\.\d+\.\d+/g, `node ${manifest.node}`);
    writeOrExpect(path, original, updated);
  }
}

const manifest = readRuntimeManifest();
validateRuntimeManifest(manifest);

if (failures.length === 0) {
  syncTextFile('.node-version', `${manifest.node}\n`);
  syncTextFile('.nvmrc', `${manifest.node}\n`);
  syncPackageJson('package.json', (packageJson) => {
    packageJson.packageManager = `pnpm@${manifest.pnpm}`;
    packageJson.scripts.setup = `corepack prepare pnpm@${manifest.pnpm} --activate && pnpm install --frozen-lockfile`;
    return packageJson;
  });
  for (const path of [
    '.github/workflows/ci.yml',
    '.github/workflows/docs.yml',
    '.github/workflows/publish.yml',
    '.github/workflows/release-please.yml',
    '.github/workflows/security.yml',
  ]) {
    syncWorkflowEnv(path, manifest);
  }
  syncScaffoldPackageManager(manifest);
  syncCompatibilityContexts(manifest);
}

if (failures.length > 0) fail('Runtime version check failed.', failures);
