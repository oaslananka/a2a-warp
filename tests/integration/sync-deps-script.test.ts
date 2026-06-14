import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(new URL('../../scripts/sync-deps.mjs', import.meta.url));
const tempRoots: string[] = [];

const nodeVersion = '24.16.0';
const pnpmVersion = '11.5.2';
const manifestNodeCompatibility = ['22.22.3', '24.16.0'];

const manifest = {
  node: nodeVersion,
  nodeCompatibility: manifestNodeCompatibility,
  nodeDockerAlpineDigest: 'sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14',
  pnpm: pnpmVersion,
  npmForPublish: '11.15.0',
};

describe('sync-deps idempotence and drift detection', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it('passes --check on a clean workspace', async () => {
    const workspace = await createSyncDepsWorkspace();
    // Write once to sync
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });
    // Second --write should produce no changes
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });
    // --check should pass
    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).resolves.toBeDefined();
  });

  it('detects drift in .node-version', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    await writeFile(join(workspace, '.node-version'), '23.0.0\n');

    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('.node-version'),
    });
  });

  it('detects drift in .nvmrc', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    await writeFile(join(workspace, '.nvmrc'), '23.0.0\n');

    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('.nvmrc'),
    });
  });

  it('detects drift in CI NODE_VERSION env', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    const ciPath = join(workspace, '.github/workflows/ci.yml');
    const ciContent = await readFile(ciPath, 'utf8');
    await writeFile(
      ciPath,
      ciContent.replace(`NODE_VERSION: '${nodeVersion}'`, "NODE_VERSION: '23.0.0'"),
    );

    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('.github/workflows/ci.yml'),
    });
  });

  it('detects drift in cli/src/generated/version.ts', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    const versionPath = join(workspace, 'cli/src/generated/version.ts');
    await writeFile(versionPath, 'export const generatedCliVersion = "0.0.0";\n');

    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('cli/src/generated/version.ts'),
    });
  });

  it('detects drift in cli/src/generated/scaffold-template.ts runtime values', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    const scaffoldPath = join(workspace, 'cli/src/generated/scaffold-template.ts');
    const scaffoldContent = await readFile(scaffoldPath, 'utf8');
    await writeFile(
      scaffoldPath,
      scaffoldContent.replace(`node: '${nodeVersion}'`, "node: '23.0.0'"),
    );

    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('scaffold-template.ts'),
    });
  });

  it('detects drift in publish.yml NPM_VERSION env', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    const publishPath = join(workspace, '.github/workflows/publish.yml');
    const publishContent = await readFile(publishPath, 'utf8');
    await writeFile(
      publishPath,
      publishContent.replace(`NPM_VERSION: '${manifest.npmForPublish}'`, "NPM_VERSION: '12.0.0'"),
    );

    await expect(
      execFileAsync('node', [scriptPath, '--check'], { cwd: workspace }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining('publish.yml'),
    });
  });

  it('detects drift after second --write pass (full idempotence)', async () => {
    const workspace = await createSyncDepsWorkspace();
    // First write
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    // Mutate multiple files
    await writeFile(join(workspace, '.node-version'), '23.0.0\n');
    await writeFile(join(workspace, '.nvmrc'), '23.0.0\n');

    // Second write should restore them
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    // Verify files restored
    const nodeVersionContent = await readFile(join(workspace, '.node-version'), 'utf8');
    expect(nodeVersionContent).toBe(`${nodeVersion}\n`);
    const nvmrcContent = await readFile(join(workspace, '.nvmrc'), 'utf8');
    expect(nvmrcContent).toBe(`${nodeVersion}\n`);

    // Third write should produce no changes
    const beforeStat = await Promise.all([
      readFile(join(workspace, '.node-version'), 'utf8'),
      readFile(join(workspace, '.nvmrc'), 'utf8'),
    ]);
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });
    const afterStat = await Promise.all([
      readFile(join(workspace, '.node-version'), 'utf8'),
      readFile(join(workspace, '.nvmrc'), 'utf8'),
    ]);
    expect(afterStat).toEqual(beforeStat);
  });

  it('reports meaningful drift messages', async () => {
    const workspace = await createSyncDepsWorkspace();
    await execFileAsync('node', [scriptPath, '--write'], { cwd: workspace });

    await writeFile(join(workspace, '.node-version'), '23.0.0\n');

    try {
      await execFileAsync('node', [scriptPath, '--check'], { cwd: workspace });
      // Should not reach here
      expect(true).toBe(false);
    } catch (e: unknown) {
      const err = e as { stderr: string };
      expect(err.stderr).toContain('.node-version');
      expect(err.stderr).toContain('mismatch');
      expect(err.stderr).toContain('Run `pnpm run deps:sync`');
    }
  });
});

async function createSyncDepsWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'a2a-sync-deps-'));
  tempRoots.push(root);

  // Write tools/runtime-versions.json
  await writeFixture(root, 'tools/runtime-versions.json', `${JSON.stringify(manifest, null, 2)}\n`);

  // Write root package.json
  await writeFixture(
    root,
    'package.json',
    `${JSON.stringify(
      {
        name: 'a2a-warp-test',
        private: true,
        scripts: {
          setup: `corepack prepare pnpm@${pnpmVersion} --activate && pnpm install --frozen-lockfile`,
        },
      },
      null,
      2,
    )}\n`,
  );

  // Write cli package.json (needed for syncCliGenerated)
  await writeFixture(
    root,
    'cli/package.json',
    `${JSON.stringify(
      {
        name: '@oaslananka/a2a-warp-cli',
        version: '9.0.0',
      },
      null,
      2,
    )}\n`,
  );

  // Write packages/core/package.json (needed for scaffold generation)
  await writeFixture(
    root,
    'packages/core/package.json',
    `${JSON.stringify(
      {
        name: '@oaslananka/a2a-warp',
        version: '9.0.0',
        dependencies: {
          zod: '^4.4.3',
        },
      },
      null,
      2,
    )}\n`,
  );

  // Write packages/adapters/package.json (needed for scaffold)
  await writeFixture(
    root,
    'packages/adapters/package.json',
    `${JSON.stringify(
      {
        name: '@oaslananka/a2a-warp-adapters',
        version: '9.0.0',
        peerDependencies: {
          langchain: '^0.3.37 || ^1.0.0',
        },
      },
      null,
      2,
    )}\n`,
  );

  // Write packages/registry/package.json (needed for scaffold)
  await writeFixture(
    root,
    'packages/registry/package.json',
    `${JSON.stringify(
      {
        name: '@oaslananka/a2a-warp-registry',
        version: '9.0.0',
      },
      null,
      2,
    )}\n`,
  );

  // Write apps/demo/package.json (needed for scaffold deps)
  await writeFixture(
    root,
    'apps/demo/package.json',
    `${JSON.stringify(
      {
        name: 'a2a-warp-demo',
        private: true,
        dependencies: {
          '@anthropic-ai/sdk': '^0.102.0',
          openai: '6.42.0',
        },
        devDependencies: {
          tsx: '4.22.4',
        },
      },
      null,
      2,
    )}\n`,
  );

  // Write root-level devDependencies
  await writeFixture(
    root,
    'package.json',
    `${JSON.stringify(
      {
        name: 'a2a-warp-test',
        private: true,
        scripts: {
          setup: `corepack prepare pnpm@${pnpmVersion} --activate && pnpm install --frozen-lockfile`,
        },
        devDependencies: {
          '@types/node': '22.19.20',
          typescript: '6.0.3',
        },
      },
      null,
      2,
    )}\n`,
  );

  // Write workflows
  await writeFixture(root, '.github/workflows/ci.yml', ciWorkflow());
  for (const workflow of ['docs.yml', 'release-please.yml', 'security.yml']) {
    await writeFixture(
      root,
      `.github/workflows/${workflow}`,
      `name: ${workflow.replace('.yml', '')}\n\nenv:\n  NODE_VERSION: '${nodeVersion}'\n`,
    );
  }
  await writeFixture(
    root,
    '.github/workflows/publish.yml',
    `name: publish\n\nenv:\n  NODE_VERSION: '${nodeVersion}'\n  NPM_VERSION: '${manifest.npmForPublish}'\n`,
  );

  // Write rulesets
  await writeFixture(
    root,
    '.github/rulesets/main.json',
    ruleset(['CI / identity', 'Docs / build']),
  );

  // Write branch protection doc
  await writeFixture(
    root,
    'docs/release/branch-protection.md',
    branchProtectionDoc(['CI / identity', 'Docs / build']),
  );

  // Write initial generated files (as if they came from an older sync)
  await writeFixture(
    root,
    'cli/src/generated/version.ts',
    `// This file is generated by scripts/sync-deps.mjs from cli/package.json.
export const generatedCliVersion = '9.0.0';\n`,
  );
  await writeFixture(
    root,
    'cli/src/generated/scaffold-template.ts',
    `// This file is generated by scripts/sync-deps.mjs from workspace manifests and tools/runtime-versions.json.
export const scaffoldTemplateConfig = {
  dependencies: {
    '@oaslananka/a2a-warp': '^9.0.0',
    '@oaslananka/a2a-warp-adapters': '^9.0.0',
    '@oaslananka/a2a-warp-registry': '^9.0.0',
    '@anthropic-ai/sdk': '^0.102.0',
    langchain: '^0.3.37 || ^1.0.0',
    openai: '6.42.0',
    zod: '^4.4.3',
  },
  devDependencies: {
    '@types/node': '22.19.20',
    tsx: '4.22.4',
    typescript: '6.0.3',
  },
  runtime: {
    node: '24.16.0',
    nodeDockerAlpineDigest:
      'sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14',
    pnpm: '11.5.2',
  },
} as const;\n`,
  );

  return root;
}

async function writeFixture(root: string, path: string, content: string): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

function ciWorkflow(): string {
  return `name: CI

env:
  NODE_VERSION: '${nodeVersion}'

jobs:
  compatibility-smoke:
    name: CI / compatibility-smoke (\${{ matrix.os }}, node \${{ matrix.node }})
    runs-on: \${{ matrix.runner }}
    timeout-minutes: 20
    strategy:
      fail-fast: false
      matrix:
        include:
          - os: ubuntu-latest
            runner: ubuntu-latest
            node: '22.22.3'
          - os: windows-latest
            runner: windows-latest
            node: '${nodeVersion}'
          - os: macos-latest
            runner: macos-latest
            node: '${nodeVersion}'
    steps:
      - uses: actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10
`;
}

function ruleset(contexts: string[]): string {
  return `${JSON.stringify(
    {
      name: 'main-protection',
      rules: [
        {
          type: 'required_status_checks',
          parameters: {
            required_status_checks: contexts.map((context) => ({ context })),
          },
        },
      ],
    },
    null,
    2,
  )}\n`;
}

function branchProtectionDoc(contexts: string[]): string {
  return `# Branch Protection

${contexts.map((context) => `- \`${context}\``).join('\n')}
`;
}
