import { writeFileSync } from 'node:fs';
import { readJson, readText, fail } from './check-utils.mjs';

const write = process.argv.includes('--write');
const manifestPath = 'tools/runtime-versions.json';
const semverPattern = /^\d+\.\d+\.\d+$/;
const compatibilityContextPrefix = 'CI / compatibility-smoke (';
const compatibilityMatrixKeys = new Set(['os', 'runner', 'node']);
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

function stripYamlScalar(value) {
  return value
    .trim()
    .replace(/\s+#.*$/, '')
    .replace(/^['"]|['"]$/g, '');
}

function completeCompatibilityRow(row, path) {
  if (!row) return undefined;
  const missing = ['os', 'runner', 'node'].filter((key) => !row[key]);
  if (missing.length > 0) {
    failures.push(`${path}: compatibility matrix row missing ${missing.join(', ')}`);
    return undefined;
  }
  return row;
}

function lineIndent(line) {
  return /^\s*/.exec(line)?.[0].length ?? 0;
}

function readCompatibilityMatrix(path) {
  const rows = [];
  let inCompatibilityJob = false;
  let inInclude = false;
  let includeIndent;
  let current;

  const completeCurrent = () => {
    const completed = completeCompatibilityRow(current, path);
    if (completed) rows.push(completed);
    current = undefined;
  };

  for (const line of readText(path).split(/\r?\n/)) {
    if (/^  compatibility-smoke:\s*(?:#.*)?$/.test(line)) {
      inCompatibilityJob = true;
      continue;
    }
    if (inCompatibilityJob && /^  [A-Za-z0-9_-]+:\s*(?:#.*)?$/.test(line)) {
      completeCurrent();
      break;
    }
    if (!inCompatibilityJob) continue;

    const includeMatch = /^(\s+)include:\s*(?:#.*)?$/.exec(line);
    if (includeMatch) {
      inInclude = true;
      includeIndent = includeMatch[1].length;
      continue;
    }
    if (!inInclude) continue;

    if (
      includeIndent !== undefined &&
      line.trim() !== '' &&
      lineIndent(line) <= includeIndent &&
      /^\s*[A-Za-z0-9_-]+:\s*(?:#.*)?$/.test(line)
    ) {
      completeCurrent();
      inInclude = false;
      includeIndent = undefined;
      continue;
    }

    const itemMatch = /^\s+-\s+([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
    if (itemMatch) {
      completeCurrent();
      current = {};
      if (compatibilityMatrixKeys.has(itemMatch[1])) {
        current[itemMatch[1]] = stripYamlScalar(itemMatch[2]);
      }
      continue;
    }

    const keyMatch = /^\s+([A-Za-z0-9_-]+):\s*(.*?)\s*$/.exec(line);
    if (keyMatch && current && compatibilityMatrixKeys.has(keyMatch[1])) {
      current[keyMatch[1]] = stripYamlScalar(keyMatch[2]);
    }
  }

  completeCurrent();
  if (rows.length === 0) failures.push(`${path}: compatibility matrix include rows not found`);
  return rows;
}

function compatibilityContext(row) {
  return `CI / compatibility-smoke (${row.os}, node ${row.node})`;
}

function compatibilityContextOs(context) {
  return /^CI \/ compatibility-smoke \(([^,]+), node [^)]+\)$/.exec(context)?.[1];
}

function readRulesetCompatibilityContexts(path) {
  const ruleset = readJson(path);
  const statusRule = ruleset.rules?.find((rule) => rule.type === 'required_status_checks');
  const contexts = statusRule?.parameters?.required_status_checks ?? [];
  if (!Array.isArray(contexts)) {
    failures.push(`${path}: required_status_checks must be an array`);
    return [];
  }
  return contexts
    .map((entry) => entry?.context)
    .filter(
      (context) => typeof context === 'string' && context.startsWith(compatibilityContextPrefix),
    );
}

function syncRulesetCompatibilityContexts(path, expectedContexts) {
  const original = readText(path);
  const ruleset = JSON.parse(original);
  const statusRule = ruleset.rules?.find((rule) => rule.type === 'required_status_checks');
  const contexts = statusRule?.parameters?.required_status_checks;
  if (!Array.isArray(contexts)) {
    failures.push(`${path}: required_status_checks must be an array`);
    return;
  }

  const firstCompatibilityIndex = contexts.findIndex((entry) =>
    entry?.context?.startsWith(compatibilityContextPrefix),
  );
  const nonCompatibilityContexts = contexts.filter(
    (entry) => !entry?.context?.startsWith(compatibilityContextPrefix),
  );
  const existingCompatibilityContexts = contexts.filter((entry) =>
    entry?.context?.startsWith(compatibilityContextPrefix),
  );
  const existingCompatibilityByOs = new Map();
  for (const entry of existingCompatibilityContexts) {
    const os = compatibilityContextOs(entry.context);
    if (os && !existingCompatibilityByOs.has(os)) existingCompatibilityByOs.set(os, entry);
  }
  const compatibilityContexts = expectedContexts.map((context, index) => {
    const os = compatibilityContextOs(context);
    const source =
      (os && existingCompatibilityByOs.get(os)) ?? existingCompatibilityContexts[index] ?? {};
    return { ...source, context };
  });
  const insertAt =
    firstCompatibilityIndex === -1 ? nonCompatibilityContexts.length : firstCompatibilityIndex;
  const updatedContexts = [
    ...nonCompatibilityContexts.slice(0, insertAt),
    ...compatibilityContexts,
    ...nonCompatibilityContexts.slice(insertAt),
  ];
  const current = contexts.map((entry) => entry?.context).filter(Boolean);
  const updated = updatedContexts.map((entry) => entry.context);
  if (JSON.stringify(current) === JSON.stringify(updated)) return;

  statusRule.parameters.required_status_checks = updatedContexts;
  writeOrExpect(path, original, normalizeJson(ruleset));
}

function syncBranchProtectionCompatibilityContexts(path, expectedContexts) {
  const original = readText(path);
  const expectedLines = expectedContexts.map((context) => `- \`${context}\``);
  const compatibilityLinePattern = /^- `CI \/ compatibility-smoke \([^)]+\)`$/;
  const filteredLines = [];
  let insertAt = -1;

  for (const line of original.split('\n')) {
    if (compatibilityLinePattern.test(line)) {
      if (insertAt === -1) insertAt = filteredLines.length;
      continue;
    }
    filteredLines.push(line);
  }

  if (insertAt === -1) insertAt = filteredLines.indexOf('- `Docs / build`');
  if (insertAt === -1) {
    insertAt = filteredLines.at(-1) === '' ? filteredLines.length - 1 : filteredLines.length;
    if (insertAt > 0 && filteredLines[insertAt - 1] !== '') {
      filteredLines.splice(insertAt, 0, '');
      insertAt += 1;
    }
  }

  filteredLines.splice(insertAt, 0, ...expectedLines);
  const updated = filteredLines.join('\n');
  writeOrExpect(path, original, updated);
}

function compareContextSets(path, actual, expected, label) {
  const missing = expected.filter((context) => !actual.includes(context));
  const extra = actual.filter((context) => !expected.includes(context));
  if (missing.length === 0 && extra.length === 0) return;
  failures.push(
    `${path}: ${label} compatibility contexts must match CI matrix job names` +
      `${missing.length > 0 ? `; missing ${missing.join(', ')}` : ''}` +
      `${extra.length > 0 ? `; extra ${extra.join(', ')}` : ''}`,
  );
}

function readBranchProtectionCompatibilityContexts(path) {
  return [...readText(path).matchAll(/- `(CI \/ compatibility-smoke \([^)]+\))`/g)].map(
    (match) => match[1],
  );
}

function validateCompatibilityConfiguration(manifest, rows, expectedContexts) {
  const manifestVersions = new Set(manifest.nodeCompatibility);
  for (const row of rows) {
    if (!manifestVersions.has(row.node)) {
      failures.push(
        `.github/workflows/ci.yml: compatibility matrix node ${row.node} is not present in ${manifestPath}`,
      );
    }
  }

  for (const version of manifest.nodeCompatibility) {
    if (!rows.some((row) => row.node === version)) {
      failures.push(`.github/workflows/ci.yml: compatibility matrix missing node ${version}`);
    }
  }

  for (const row of rows) {
    if (row.os !== 'ubuntu-latest' && row.node !== manifest.node) {
      failures.push(
        `.github/workflows/ci.yml: ${row.os} compatibility smoke must use primary node ${manifest.node}`,
      );
    }
  }

  compareContextSets(
    '.github/rulesets/main.json',
    readRulesetCompatibilityContexts('.github/rulesets/main.json'),
    expectedContexts,
    'required',
  );
  compareContextSets(
    'docs/release/branch-protection.md',
    readBranchProtectionCompatibilityContexts('docs/release/branch-protection.md'),
    expectedContexts,
    'documented',
  );
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
  const failuresBeforeMatrixRead = failures.length;
  const compatibilityRows = readCompatibilityMatrix('.github/workflows/ci.yml');
  if (failures.length === failuresBeforeMatrixRead) {
    const expectedCompatibilityContexts = compatibilityRows.map(compatibilityContext);
    syncRulesetCompatibilityContexts('.github/rulesets/main.json', expectedCompatibilityContexts);
    syncBranchProtectionCompatibilityContexts(
      'docs/release/branch-protection.md',
      expectedCompatibilityContexts,
    );
    validateCompatibilityConfiguration(manifest, compatibilityRows, expectedCompatibilityContexts);
  }
}

if (failures.length > 0) fail('Runtime version check failed.', failures);
