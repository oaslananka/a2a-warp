// sync-deps.mjs - Centralized dependency-derived file synchronization
//
// MODES
//   --write   Update derived files in place.
//   --check   Verify derived files are up to date (exit non-zero on drift).
//
// This script:
//   - Reads authoritative sources (package.json files, runtime-versions.json, workflows)
//   - Regenerates derived files (scaffold, workflow envs, rulesets, docs)
//   - In --check mode, reports drift with specific file/line messages

import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// ─── Helpers ────────────────────────────────────────────────────────────────

const repoRoot = process.cwd();
const isWrite = process.argv.includes('--write');
const isCheck = process.argv.includes('--check') || !isWrite; // default to check
const failures = [];
const changedFiles = [];

function readJson(relPath) {
  return JSON.parse(readFileSync(resolve(repoRoot, relPath), 'utf8'));
}

function readText(relPath) {
  return readFileSync(resolve(repoRoot, relPath), 'utf8');
}

function writeText(relPath, content) {
  const fullPath = resolve(repoRoot, relPath);
  const existing = existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
  if (existing === content) return;
  if (isWrite) {
    writeFileSync(fullPath, content);
    changedFiles.push(relPath);
  } else {
    // Find first line that differs
    const existingLines = existing.split('\n');
    const contentLines = content.split('\n');
    const maxLen = Math.max(existingLines.length, contentLines.length);
    for (let i = 0; i < maxLen; i++) {
      if (existingLines[i] !== contentLines[i]) {
        const lineNum = i + 1;
        const from = i < existingLines.length ? existingLines[i] : '<EOF>';
        const to = i < contentLines.length ? contentLines[i] : '<EOF>';
        failures.push(
          `${relPath}:${lineNum} mismatch. Expected ${JSON.stringify(to)} but found ${JSON.stringify(from)}`,
        );
        break;
      }
    }
  }
}

function normalizeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

// ─── Authoritative sources ──────────────────────────────────────────────────

const runtimeManifest = readJson('tools/runtime-versions.json');
const rootPkg = readJson('package.json');
const workspacePackages = [];

// Collect all workspace package.json files
for (const dir of ['packages', 'cli', 'apps', 'docs-site']) {
  const entries = existsSync(dir) ? readdirEntries(dir) : [];
  for (const entry of entries) {
    const pkgPath = `${dir}/${entry}/package.json`;
    if (existsSync(resolve(repoRoot, pkgPath))) {
      try {
        const pkg = readJson(pkgPath);
        workspacePackages.push({ dir: `${dir}/${entry}`, pkg, path: pkgPath });
      } catch { /* skip invalid */ }
    }
  }
}

function readdirEntries(dir) {
  try {
    return readdirSync(resolve(repoRoot, dir), { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch { return []; }
}

function readPackageVersion(pkgDir) {
  const pkg = workspacePackages.find(w => w.dir === pkgDir);
  if (!pkg) throw new Error(`Package ${pkgDir} not found in workspace`);
  return pkg.pkg.version;
}

function readDependencyRange(fromPkg, section, depName) {
  const range = fromPkg[section]?.[depName];
  if (typeof range !== 'string' || range.length === 0) {
    throw new Error(`${depName} not found in ${section} of workspace`);
  }
  return range;
}

// ─── 1. .node-version and .nvmrc ────────────────────────────────────────────

const nodeVersion = runtimeManifest.node;

function syncNodeVersionFiles() {
  writeText('.node-version', `${nodeVersion}\n`);
  writeText('.nvmrc', `${nodeVersion}\n`);
}

// ─── 2. Root package.json (packageManager + setup script) ───────────────────

const pnpmVersion = runtimeManifest.pnpm;

function syncRootPackageJson() {
  const updated = structuredClone(rootPkg);
  updated.packageManager = `pnpm@${pnpmVersion}`;
  updated.scripts = { ...updated.scripts, setup: `corepack prepare pnpm@${pnpmVersion} --activate && pnpm install --frozen-lockfile` };
  writeText('package.json', normalizeJson(updated));
}

// ─── 3. Workflow env variables ──────────────────────────────────────────────

function syncWorkflowEnv(path) {
  let content = readText(path);
  const original = content;

  // Update NODE_VERSION
  content = content.replace(
    /NODE_VERSION:\s*'[^']+'/g,
    `NODE_VERSION: '${nodeVersion}'`,
  );

  if (path.includes('ci.yml')) {
    // Update compatibility matrix node versions
    const compatibilityMinimum = (runtimeManifest.nodeCompatibility || [])
      .find(v => v !== nodeVersion);
    if (compatibilityMinimum) {
      content = content.replace(
        /node:\s*'22\.\d+\.\d+'/g,
        `node: '${compatibilityMinimum}'`,
      );
    }
    content = content.replace(
      /node:\s*'24\.\d+\.\d+'/g,
      `node: '${nodeVersion}'`,
    );
  }

  if (path.includes('publish.yml')) {
    content = content.replace(
      /NPM_VERSION:\s*'[^']+'/g,
      `NPM_VERSION: '${runtimeManifest.npmForPublish}'`,
    );
  }

  if (content !== original) {
    writeText(path, content);
  }
}

function syncWorkflowEnvs() {
  for (const path of [
    '.github/workflows/ci.yml',
    '.github/workflows/docs.yml',
    '.github/workflows/publish.yml',
    '.github/workflows/release-please.yml',
    '.github/workflows/security.yml',
  ]) {
    if (existsSync(resolve(repoRoot, path))) {
      syncWorkflowEnv(path);
    }
  }
}

// ─── 4. CLI generated files ─────────────────────────────────────────────────

function syncCliGenerated() {
  const cliPkg = workspacePackages.find(w => w.dir === 'cli')?.pkg;
  if (!cliPkg) return;

  const version = cliPkg.version;
  if (typeof version !== 'string' || version.length === 0) {
    throw new Error('cli/package.json must define a version string');
  }

  // cli/src/generated/version.ts
  const escapedVersion = version.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const versionContent = `// This file is written by scripts/sync-deps.mjs from cli/package.json.
export const generatedCliVersion = '${escapedVersion}';\n`;
  writeText('cli/src/generated/version.ts', versionContent);

  // cli/src/generated/scaffold-template.ts
  const corePkg = workspacePackages.find(w => w.dir === 'packages/core')?.pkg;
  const adaptersPkg = workspacePackages.find(w => w.dir === 'packages/adapters')?.pkg;
  const registryPkg = workspacePackages.find(w => w.dir === 'packages/registry')?.pkg;
  const demoPkg = workspacePackages.find(w => w.dir === 'apps/demo')?.pkg;

  if (!corePkg || !adaptersPkg || !registryPkg || !demoPkg) {
    throw new Error('Required workspace packages not found for scaffold generation');
  }

  const scaffold = {
    dependencies: {
      '@oaslananka/a2a-warp': `^${corePkg.version}`,
      '@oaslananka/a2a-warp-adapters': `^${adaptersPkg.version}`,
      '@oaslananka/a2a-warp-registry': `^${registryPkg.version}`,
      '@anthropic-ai/sdk': readDependencyRange(demoPkg, 'dependencies', '@anthropic-ai/sdk'),
      langchain: readDependencyRange(adaptersPkg, 'peerDependencies', 'langchain'),
      openai: readDependencyRange(adaptersPkg, 'devDependencies', 'openai'),
      zod: readDependencyRange(corePkg, 'dependencies', 'zod'),
    },
    devDependencies: {
      '@types/node': readDependencyRange(rootPkg, 'devDependencies', '@types/node'),
      tsx: readDependencyRange(demoPkg, 'devDependencies', 'tsx'),
      typescript: readDependencyRange(rootPkg, 'devDependencies', 'typescript'),
    },
    runtime: {
      node: runtimeManifest.node,
      nodeDockerAlpineDigest: runtimeManifest.nodeDockerAlpineDigest,
      pnpm: runtimeManifest.pnpm,
    },
  };

  const quote = (v) => `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

  const scaffoldContent = `// This file is written by scripts/sync-deps.mjs from workspace manifests and tools/runtime-versions.json.
export const scaffoldTemplateConfig = {
  dependencies: {
    '@oaslananka/a2a-warp': ${quote(scaffold.dependencies['@oaslananka/a2a-warp'])},
    '@oaslananka/a2a-warp-adapters': ${quote(scaffold.dependencies['@oaslananka/a2a-warp-adapters'])},
    '@oaslananka/a2a-warp-registry': ${quote(scaffold.dependencies['@oaslananka/a2a-warp-registry'])},
    '@anthropic-ai/sdk': ${quote(scaffold.dependencies['@anthropic-ai/sdk'])},
    langchain: ${quote(scaffold.dependencies.langchain)},
    openai: ${quote(scaffold.dependencies.openai)},
    zod: ${quote(scaffold.dependencies.zod)},
  },
  devDependencies: {
    '@types/node': ${quote(scaffold.devDependencies['@types/node'])},
    tsx: ${quote(scaffold.devDependencies.tsx)},
    typescript: ${quote(scaffold.devDependencies.typescript)},
  },
  runtime: {
    node: ${quote(scaffold.runtime.node)},
    nodeDockerAlpineDigest:
      ${quote(scaffold.runtime.nodeDockerAlpineDigest)},
    pnpm: ${quote(scaffold.runtime.pnpm)},
  },
} as const;
`;

  writeText('cli/src/generated/scaffold-template.ts', scaffoldContent);
}

// ─── 5. Compatibility contexts ──────────────────────────────────────────────

const compatibilityContextPrefix = 'CI / compatibility-smoke (';

function readCompatibilityMatrix(path) {
  // Parse YAML include entries from ci.yml compatibility-smoke job
  const rows = [];
  const content = readText(path);
  const lines = content.split(/\r?\n/);

  let inCompatibilityJob = false;
  let compatIndent = 0;
  let inInclude = false;
  let includeIndent = 0;
  let current = null;

  const flushCurrent = () => {
    if (current && current.os && current.runner && current.node) {
      rows.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const compatMatch = /^(\s*)compatibility-smoke:\s*(?:#.*)?$/.exec(line);
    if (compatMatch) {
      inCompatibilityJob = true;
      compatIndent = compatMatch[1].length;
      continue;
    }
    if (inCompatibilityJob && compatIndent > 0 && line.trim() !== '' && /^  [a-z]/i.test(line) && lineIndent(line) === compatIndent) {
      flushCurrent();
      inCompatibilityJob = false;
      continue;
    }
    if (inCompatibilityJob && /^\s+include:\s*(?:#.*)?$/.test(line)) {
      inInclude = true;
      includeIndent = lineIndent(line);
      continue;
    }
    if (!inCompatibilityJob || !inInclude) continue;

    if (line.trim() === '') continue;
    if (lineIndent(line) <= includeIndent && /^[a-z]/i.test(line.trim())) {
      flushCurrent();
      inInclude = false;
      continue;
    }

    // Parse key-value pairs in include block
    const kvMatch = /^\s+([a-z_]+):\s*(.*?)\s*$/.exec(line);
    if (kvMatch) {
      const key = kvMatch[1];
      let val = kvMatch[2].trim();
      // Remove inline comments and quotes
      val = val.replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
      if (!current) current = {};
      current[key] = val;
    }

    // Detect list item start
    const itemMatch = /^\s+-\s+([a-z_]+):\s*(.*?)\s*$/.exec(line);
    if (itemMatch) {
      flushCurrent();
      current = {};
      let val = itemMatch[2].trim();
      val = val.replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
      current[itemMatch[1]] = val;
    }
  }
  flushCurrent();
  return rows;
}

function lineIndent(line) {
  return /^\s*/.exec(line)?.[0].length ?? 0;
}

function compatibilityContext(row) {
  return `${compatibilityContextPrefix}${row.os}, node ${row.node})`;
}

function compatibilityContextOs(context) {
  const m = /^CI \/ compatibility-smoke \(([^,]+), node [^)]+\)$/.exec(context);
  return m?.[1];
}

function syncRulesetCompatibilityContexts(rulesetPath, expectedContexts) {
  if (!existsSync(resolve(repoRoot, rulesetPath))) return;
  const ruleset = readJson(rulesetPath);
  const statusRule = ruleset.rules?.find(r => r.type === 'required_status_checks');
  if (!statusRule?.parameters?.required_status_checks) return;

  const contexts = statusRule.parameters.required_status_checks;
  const compatPrefix = compatibilityContextPrefix;

  // Extract non-compatibility contexts
  const nonCompatContexts = contexts.filter(
    entry => !entry?.context?.startsWith(compatPrefix)
  );
  const existingCompatContexts = contexts.filter(
    entry => entry?.context?.startsWith(compatPrefix)
  );

  // Build map of existing contexts by OS
  const existingByOs = new Map();
  for (const entry of existingCompatContexts) {
    const os = compatibilityContextOs(entry.context);
    if (os && !existingByOs.has(os)) existingByOs.set(os, entry);
  }

  // Build new compatibility contexts preserving existing metadata
  const newCompatContexts = expectedContexts.map((context, i) => {
    const os = compatibilityContextOs(context);
    const source = (os && existingByOs.get(os)) || existingCompatContexts[i] || {};
    return { ...source, context };
  });

  // Find insertion point (after last non-compat or at end of compat block)
  const firstCompatIdx = contexts.findIndex(
    entry => entry?.context?.startsWith(compatPrefix)
  );
  const insertAt = firstCompatIdx === -1 ? nonCompatContexts.length : firstCompatIdx;

  const updatedContexts = [
    ...nonCompatContexts.slice(0, insertAt),
    ...newCompatContexts,
    ...nonCompatContexts.slice(insertAt),
  ];

  // Check if change needed
  const current = contexts.map(e => e?.context).filter(Boolean);
  const updated = updatedContexts.map(e => e?.context).filter(Boolean);
  if (JSON.stringify(current) === JSON.stringify(updated)) return;

  statusRule.parameters.required_status_checks = updatedContexts;
  writeText(rulesetPath, normalizeJson(ruleset));
}

function syncBranchProtectionCompatibilityContexts(docPath, expectedContexts) {
  if (!existsSync(resolve(repoRoot, docPath))) return;
  const original = readText(docPath);
  const lines = original.split('\n');
  const compatLinePattern = /^- `CI \/ compatibility-smoke \([^)]+\)`$/;

  // Filter out existing compatibility lines and track insertion point
  const filtered = [];
  let insertAt = -1;

  for (const line of lines) {
    if (compatLinePattern.test(line)) {
      if (insertAt === -1) insertAt = filtered.length;
      continue;
    }
    filtered.push(line);
  }

  // Default insertion: before Docs / build line
  if (insertAt === -1) {
    insertAt = filtered.findIndex(l => l.includes('Docs / build'));
  }
  if (insertAt === -1) {
    insertAt = filtered.length;
    if (insertAt > 0 && filtered[insertAt - 1] !== '') {
      filtered.splice(insertAt, 0, '');
      insertAt += 1;
    }
  }

  const expectedLines = expectedContexts.map(c => `- \`${c}\``);
  filtered.splice(insertAt, 0, ...expectedLines);

  const updated = filtered.join('\n');
  writeText(docPath, updated);
}

function syncCompatibilityContexts() {
  const ciPath = '.github/workflows/ci.yml';
  if (!existsSync(resolve(repoRoot, ciPath))) return;

  const rows = readCompatibilityMatrix(ciPath);
  if (rows.length === 0) {
    failures.push(`${ciPath}: compatibility matrix include rows not found`);
    return;
  }

  const expectedContexts = rows.map(compatibilityContext);

  syncRulesetCompatibilityContexts('.github/rulesets/main.json', expectedContexts);
  syncBranchProtectionCompatibilityContexts(
    'docs/release/branch-protection.md',
    expectedContexts,
  );

  // Validate compatibility matrix against runtime manifest
  const manifestVersions = new Set(runtimeManifest.nodeCompatibility || []);
  for (const row of rows) {
    if (!manifestVersions.has(row.node)) {
      failures.push(
        `${ciPath}: compatibility matrix node ${row.node} not present in tools/runtime-versions.json nodeCompatibility`,
      );
    }
    if (row.os !== 'ubuntu-latest' && row.node !== nodeVersion) {
      failures.push(
        `${ciPath}: ${row.os} compatibility smoke must use primary node ${nodeVersion}`,
      );
    }
  }
  for (const version of manifestVersions) {
    if (!rows.some(r => r.node === version)) {
      failures.push(`${ciPath}: compatibility matrix missing node ${version}`);
    }
  }
}

// ─── 6. Validate scaffold template has correct runtime values ───────────────

function validateGeneratedScaffold() {
  const scaffoldPath = 'cli/src/generated/scaffold-template.ts';
  if (!existsSync(resolve(repoRoot, scaffoldPath))) {
    failures.push(`${scaffoldPath}: missing generated scaffold file`);
    return;
  }
  const content = readText(scaffoldPath);
  const required = [
    `node: '${runtimeManifest.node}'`,
    runtimeManifest.nodeDockerAlpineDigest,
    `pnpm: '${runtimeManifest.pnpm}'`,
  ];
  for (const snippet of required) {
    if (!content.includes(snippet)) {
      failures.push(`${scaffoldPath}: runtime values must match tools/runtime-versions.json`);
      break;
    }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const label = isWrite ? 'Writing' : 'Checking';

  console.log(`[sync-deps] ${label} dependency-derived files...`);
  console.log(`[sync-deps] Node: ${nodeVersion}, pnpm: ${pnpmVersion}`);

  // 1. Node version files
  syncNodeVersionFiles();

  // 2. Root package.json
  syncRootPackageJson();

  // 3. Workflow envs
  syncWorkflowEnvs();

  // 4. CLI generated files
  syncCliGenerated();

  // 5. Compatibility contexts (ruleset + branch protection doc)
  syncCompatibilityContexts();

  // 6. Validate scaffold
  validateGeneratedScaffold();

  // ─── Report ──────────────────────────────────────────────────────────────

  if (isWrite) {
    if (changedFiles.length > 0) {
      console.log(`[sync-deps] Updated ${changedFiles.length} file(s):`);
      for (const f of changedFiles) {
        console.log(`  - ${f}`);
      }
    } else {
      console.log('[sync-deps] All derived files are up to date.');
    }
  } else {
    if (failures.length > 0) {
      console.error('[sync-deps] CHECK FAILED — derived files are out of date.');
      console.error('Run `pnpm run deps:sync` to regenerate them.');
      console.error('');
      for (const f of failures) {
        console.error(`  - ${f}`);
      }
      process.exitCode = 1;
    } else {
      console.log('[sync-deps] All derived files are in sync.');
    }
  }
}

main();
