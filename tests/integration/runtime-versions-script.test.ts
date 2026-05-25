import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(
  new URL('../../scripts/check-runtime-versions.mjs', import.meta.url),
);
const tempRoots: string[] = [];

const manifest = {
  node: '24.16.0',
  nodeCompatibility: ['22.22.3', '24.16.0'],
  pnpm: '11.2.2',
  npmForPublish: '11.15.0',
};

describe('runtime version manifest checks', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it('fails when CI compatibility matrix includes a Node version outside the runtime manifest', async () => {
    const workspace = await createRuntimeWorkspace({
      compatibilityRows: [
        { os: 'ubuntu-latest', runner: 'ubuntu-latest', node: '22.22.3' },
        { os: 'ubuntu-latest', runner: 'ubuntu-latest', node: '23.1.0' },
        { os: 'windows-latest', runner: 'windows-2025-vs2026', node: '24.16.0' },
        { os: 'macos-latest', runner: 'macos-latest', node: '24.16.0' },
      ],
    });

    await expect(execRuntimeCheck(workspace)).rejects.toMatchObject({
      stderr: expect.stringContaining('not present in tools/runtime-versions.json'),
    });
  });

  it('fails when branch protection compatibility contexts do not match CI job names', async () => {
    const workspace = await createRuntimeWorkspace({
      rulesetContexts: [
        'CI / compatibility-smoke (ubuntu-latest, node 22.22.3)',
        'CI / compatibility-smoke (linux-latest, node 24.16.0)',
        'CI / compatibility-smoke (macos-latest, node 24.16.0)',
      ],
    });

    await expect(execRuntimeCheck(workspace)).rejects.toMatchObject({
      stderr: expect.stringContaining(
        'required compatibility contexts must match CI matrix job names',
      ),
    });
  });

  it('accepts compatibility matrix rows with reordered keys and trailing comments', async () => {
    const workspace = await createRuntimeWorkspace({
      compatibilityRowsYaml: `          - node: '22.22.3' # minimum supported LTS
            runner: ubuntu-latest
            os: ubuntu-latest
          - runner: windows-2025-vs2026
            node: '24.16.0' # primary supported LTS
            os: windows-latest
          - os: macos-latest
            node: '24.16.0' # primary supported LTS
            runner: macos-latest`,
    });

    await expect(execRuntimeCheck(workspace)).resolves.toBeDefined();
  });
});

async function createRuntimeWorkspace(
  options: {
    compatibilityRows?: Array<{ os: string; runner: string; node: string }>;
    compatibilityRowsYaml?: string;
    rulesetContexts?: string[];
  } = {},
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'a2a-runtime-versions-'));
  tempRoots.push(root);

  const compatibilityRows = options.compatibilityRows ?? [
    { os: 'ubuntu-latest', runner: 'ubuntu-latest', node: '22.22.3' },
    { os: 'windows-latest', runner: 'windows-2025-vs2026', node: '24.16.0' },
    { os: 'macos-latest', runner: 'macos-latest', node: '24.16.0' },
  ];
  const rulesetContexts = options.rulesetContexts ?? [
    'CI / compatibility-smoke (ubuntu-latest, node 22.22.3)',
    'CI / compatibility-smoke (windows-latest, node 24.16.0)',
    'CI / compatibility-smoke (macos-latest, node 24.16.0)',
  ];

  await writeFixture(root, 'tools/runtime-versions.json', `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFixture(root, '.node-version', `${manifest.node}\n`);
  await writeFixture(root, '.nvmrc', `${manifest.node}\n`);
  await writeFixture(
    root,
    'package.json',
    `${JSON.stringify(
      {
        packageManager: `pnpm@${manifest.pnpm}`,
        scripts: {
          setup: `corepack prepare pnpm@${manifest.pnpm} --activate && pnpm install --frozen-lockfile`,
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFixture(
    root,
    'cli/src/commands/scaffold.ts',
    `export const fixture = { packageManager: 'pnpm@${manifest.pnpm}' };\n`,
  );
  await writeFixture(
    root,
    '.github/workflows/ci.yml',
    ciWorkflow(compatibilityRows, options.compatibilityRowsYaml),
  );
  for (const workflow of ['docs.yml', 'release-please.yml', 'security.yml']) {
    await writeFixture(root, `.github/workflows/${workflow}`, workflowWithNodeEnv());
  }
  await writeFixture(root, '.github/workflows/publish.yml', publishWorkflow());
  await writeFixture(root, '.github/rulesets/main.json', ruleset(rulesetContexts));
  await writeFixture(
    root,
    'docs/release/branch-protection.md',
    branchProtectionDoc(rulesetContexts),
  );

  return root;
}

async function execRuntimeCheck(cwd: string) {
  return execFileAsync('node', [scriptPath], { cwd });
}

async function writeFixture(root: string, path: string, content: string): Promise<void> {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content);
}

function ciWorkflow(
  rows: Array<{ os: string; runner: string; node: string }>,
  matrixRowsOverride?: string,
): string {
  const matrixRows =
    matrixRowsOverride ??
    rows
      .map(
        (row) => `          - os: ${row.os}
            runner: ${row.runner}
            node: '${row.node}'`,
      )
      .join('\n');

  return `name: CI

env:
  NODE_VERSION: '${manifest.node}'

jobs:
  compatibility-smoke:
    name: CI / compatibility-smoke (\${{ matrix.os }}, node \${{ matrix.node }})
    runs-on: \${{ matrix.runner }}
    strategy:
      matrix:
        include:
${matrixRows}
`;
}

function workflowWithNodeEnv(): string {
  return `name: fixture

env:
  NODE_VERSION: '${manifest.node}'
`;
}

function publishWorkflow(): string {
  return `name: publish

env:
  NODE_VERSION: '${manifest.node}'
  NPM_VERSION: '${manifest.npmForPublish}'
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
