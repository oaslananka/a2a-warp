import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';

const require = createRequire(import.meta.url);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readPackageVersion(packageJson, path) {
  if (typeof packageJson.version !== 'string' || packageJson.version.length === 0) {
    throw new Error(`${path} must define a version string`);
  }
  return packageJson.version;
}

function readDependencyRange(packageJson, path, section, dependencyName) {
  const range = packageJson[section]?.[dependencyName];
  if (typeof range !== 'string' || range.length === 0) {
    throw new Error(`${path} must define ${section}.${dependencyName}`);
  }
  return range;
}

function readRuntimeValue(runtimeVersions, key) {
  const value = runtimeVersions[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`tools/runtime-versions.json must define ${key}`);
  }
  return value;
}

function quoteTsString(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function renderScaffoldTemplateConfig(config) {
  return `// This file is written by scripts/build-tsc-package.mjs from workspace manifests and tools/runtime-versions.json.
export const scaffoldTemplateConfig = {
  dependencies: {
    '@oaslananka/a2a-warp': ${quoteTsString(config.dependencies['@oaslananka/a2a-warp'])},
    '@oaslananka/a2a-warp-adapters': ${quoteTsString(config.dependencies['@oaslananka/a2a-warp-adapters'])},
    '@oaslananka/a2a-warp-registry': ${quoteTsString(config.dependencies['@oaslananka/a2a-warp-registry'])},
    '@anthropic-ai/sdk': ${quoteTsString(config.dependencies['@anthropic-ai/sdk'])},
    langchain: ${quoteTsString(config.dependencies.langchain)},
    openai: ${quoteTsString(config.dependencies.openai)},
    zod: ${quoteTsString(config.dependencies.zod)},
  },
  devDependencies: {
    '@types/node': ${quoteTsString(config.devDependencies['@types/node'])},
    tsx: ${quoteTsString(config.devDependencies.tsx)},
    typescript: ${quoteTsString(config.devDependencies.typescript)},
  },
  runtime: {
    node: ${quoteTsString(config.runtime.node)},
    nodeDockerAlpineDigest:
      ${quoteTsString(config.runtime.nodeDockerAlpineDigest)},
    pnpm: ${quoteTsString(config.runtime.pnpm)},
  },
} as const;
`;
}

function generateCliGeneratedModules() {
  if (basename(process.cwd()) !== 'cli') return;

  const repoRoot = resolve('..');
  const cliPackage = readJson('package.json');
  const rootPackage = readJson(resolve(repoRoot, 'package.json'));
  const runtimeVersions = readJson(resolve(repoRoot, 'tools/runtime-versions.json'));
  const corePackage = readJson(resolve(repoRoot, 'packages/core/package.json'));
  const adaptersPackage = readJson(resolve(repoRoot, 'packages/adapters/package.json'));
  const registryPackage = readJson(resolve(repoRoot, 'packages/registry/package.json'));
  const demoPackage = readJson(resolve(repoRoot, 'apps/demo/package.json'));
  const version = readPackageVersion(cliPackage, 'cli/package.json');
  const scaffoldTemplateConfig = {
    dependencies: {
      '@oaslananka/a2a-warp': `^${readPackageVersion(corePackage, 'packages/core/package.json')}`,
      '@oaslananka/a2a-warp-adapters': `^${readPackageVersion(
        adaptersPackage,
        'packages/adapters/package.json',
      )}`,
      '@oaslananka/a2a-warp-registry': `^${readPackageVersion(
        registryPackage,
        'packages/registry/package.json',
      )}`,
      '@anthropic-ai/sdk': readDependencyRange(
        demoPackage,
        'apps/demo/package.json',
        'dependencies',
        '@anthropic-ai/sdk',
      ),
      langchain: readDependencyRange(
        adaptersPackage,
        'packages/adapters/package.json',
        'peerDependencies',
        'langchain',
      ),
      openai: readDependencyRange(
        adaptersPackage,
        'packages/adapters/package.json',
        'devDependencies',
        'openai',
      ),
      zod: readDependencyRange(corePackage, 'packages/core/package.json', 'dependencies', 'zod'),
    },
    devDependencies: {
      '@types/node': readDependencyRange(
        rootPackage,
        'package.json',
        'devDependencies',
        '@types/node',
      ),
      tsx: readDependencyRange(demoPackage, 'apps/demo/package.json', 'devDependencies', 'tsx'),
      typescript: readDependencyRange(rootPackage, 'package.json', 'devDependencies', 'typescript'),
    },
    runtime: {
      node: readRuntimeValue(runtimeVersions, 'node'),
      nodeDockerAlpineDigest: readRuntimeValue(runtimeVersions, 'nodeDockerAlpineDigest'),
      pnpm: readRuntimeValue(runtimeVersions, 'pnpm'),
    },
  };

  const generatedDir = resolve('src/generated');
  const escapedVersion = version.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(
    resolve(generatedDir, 'version.ts'),
    `// This file is written by scripts/build-tsc-package.mjs from cli/package.json.\nexport const generatedCliVersion = '${escapedVersion}';\n`,
  );
  writeFileSync(
    resolve(generatedDir, 'scaffold-template.ts'),
    renderScaffoldTemplateConfig(scaffoldTemplateConfig),
  );
}

generateCliGeneratedModules();
rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-b', '--force'], {
  stdio: 'inherit',
});
