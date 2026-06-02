import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import { run } from '../src/index.js';
import type { spawnSync } from 'node:child_process';

const runtimeVersions = JSON.parse(
  await readFile(new URL('../../../tools/runtime-versions.json', import.meta.url), 'utf8'),
) as { node: string; pnpm: string; npmForPublish: string; nodeCompatibility: string[] };

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const createBinary = resolve(repoRoot, 'packages/create-a2a-agent/bin/create-a2a-warp.js');

type ScaffoldAdapter =
  | 'custom'
  | 'openai'
  | 'anthropic'
  | 'langchain'
  | 'pack-research-team'
  | 'pack-support-triage';

interface TemplateExpectation {
  adapter: ScaffoldAdapter;
  name: string;
  args?: string[];
  packageDependency: string;
  sourceMarker: string;
  envMarker?: string;
  docker?: boolean;
}

interface LocalPackageOverride {
  name: string;
  specifier: string;
}

const localPackageDirs = [
  ['@oaslananka/a2a-warp', 'packages/core'],
  ['@oaslananka/a2a-warp-core', 'packages/core-types'],
  ['@oaslananka/a2a-warp-adapter-base', 'packages/adapter-base'],
  ['@oaslananka/a2a-warp-adapters', 'packages/adapters'],
  ['@oaslananka/a2a-warp-adapter-openai', 'packages/adapter-openai'],
  ['@oaslananka/a2a-warp-adapter-anthropic', 'packages/adapter-anthropic'],
  ['@oaslananka/a2a-warp-adapter-langchain', 'packages/adapter-langchain'],
  ['@oaslananka/a2a-warp-adapter-google-adk', 'packages/adapter-google-adk'],
  ['@oaslananka/a2a-warp-adapter-llamaindex', 'packages/adapter-llamaindex'],
  ['@oaslananka/a2a-warp-adapter-crewai', 'packages/adapter-crewai'],
  ['@oaslananka/a2a-warp-registry', 'packages/registry'],
  ['@oaslananka/a2a-warp-auth', 'packages/auth'],
  ['@oaslananka/a2a-warp-telemetry', 'packages/telemetry'],
] as const;

const templates: TemplateExpectation[] = [
  {
    adapter: 'custom',
    name: 'custom-agent',
    args: ['--auth', '--rate-limit', '--docker'],
    packageDependency: '@oaslananka/a2a-warp-adapters',
    sourceMarker: 'BaseAdapter',
    envMarker: 'A2A_API_KEY=your-secure-api-key-here',
    docker: true,
  },
  {
    adapter: 'openai',
    name: 'openai-agent',
    packageDependency: 'openai',
    sourceMarker: 'OpenAIAdapter',
    envMarker: 'OPENAI_API_KEY=your_openai_api_key_here',
  },
  {
    adapter: 'anthropic',
    name: 'anthropic-agent',
    packageDependency: '@anthropic-ai/sdk',
    sourceMarker: 'ConstructorParameters<typeof AnthropicAdapter>',
    envMarker: 'ANTHROPIC_API_KEY=',
  },
  {
    adapter: 'langchain',
    name: 'langchain-agent',
    packageDependency: 'langchain',
    sourceMarker: 'LangChainAdapter',
  },
  {
    adapter: 'pack-research-team',
    name: 'pack-research-team-agent',
    packageDependency: '@oaslananka/a2a-warp-registry',
    sourceMarker: 'createResearcher',
    envMarker: 'OPENAI_API_KEY=your_openai_api_key_here',
  },
  {
    adapter: 'pack-support-triage',
    name: 'pack-support-triage-agent',
    packageDependency: '@oaslananka/a2a-warp-registry',
    sourceMarker: 'createSupportAgent',
    envMarker: 'OPENAI_API_KEY=your_openai_api_key_here',
  },
];

async function execIn(
  cwd: string,
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execFileAsync(command, args, {
      cwd,
      env: {
        ...process.env,
        CI: 'true',
      },
      maxBuffer: 10 * 1024 * 1024,
      timeout: 180_000,
    });
  } catch (error) {
    const failure = error as Error & { stderr?: string; stdout?: string };
    const message = [
      `Command failed in ${cwd}: ${command} ${args.join(' ')}`,
      failure.stdout ? `stdout:\n${failure.stdout}` : '',
      failure.stderr ? `stderr:\n${failure.stderr}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    throw new Error(message, { cause: error });
  }
}

function parsePackFilename(output: string): string {
  const payload = JSON.parse(output) as { filename?: string } | Array<{ filename?: string }>;
  const result = Array.isArray(payload) ? payload[0] : payload;
  if (typeof result?.filename !== 'string') {
    throw new Error('pnpm pack --json did not report a tarball filename');
  }
  return result.filename;
}

async function packLocalPackageOverrides(tempDir: string): Promise<LocalPackageOverride[]> {
  const tarballDir = join(tempDir, 'tarballs');
  await mkdir(tarballDir, { recursive: true });

  const overrides: LocalPackageOverride[] = [];
  for (const [name, packageDir] of localPackageDirs) {
    const { stdout } = await execIn(repoRoot, 'pnpm', [
      '--dir',
      resolve(repoRoot, packageDir),
      'pack',
      '--json',
      '--pack-destination',
      tarballDir,
    ]);
    overrides.push({
      name,
      specifier: `file:../tarballs/${basename(parsePackFilename(stdout))}`,
    });
  }
  return overrides;
}

async function writeLocalPackageOverrides(
  projectDir: string,
  overrides: LocalPackageOverride[],
): Promise<void> {
  const lines = ['packages: []', 'overrides:'];
  for (const override of overrides) {
    lines.push(`  ${JSON.stringify(override.name)}: ${JSON.stringify(override.specifier)}`);
  }
  await writeFile(join(projectDir, 'pnpm-workspace.yaml'), `${lines.join('\n')}\n`);
}

async function readProjectFile(projectDir: string, path: string): Promise<string> {
  return readFile(join(projectDir, path), 'utf8');
}

describe('create-a2a-warp runner', () => {
  it('forwards arguments to the CLI scaffold command and returns its status', () => {
    const spawn = vi.fn(() => ({ status: 0 }));

    const status = run({
      args: ['demo-agent', '--adapter', 'custom'],
      env: { A2A_WARP_TEST: '1' },
      spawn: spawn as unknown as typeof spawnSync,
    });

    expect(status).toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      process.execPath,
      [expect.stringContaining('cli'), 'scaffold', 'demo-agent', '--adapter', 'custom'],
      {
        stdio: 'inherit',
        env: { A2A_WARP_TEST: '1' },
      },
    );
  });

  it('writes spawn errors and returns a failing status when the CLI cannot start', () => {
    const stderr = { write: vi.fn(() => true) };
    const spawn = vi.fn(() => ({
      status: null,
      error: new Error('spawn failed'),
    }));

    const status = run({
      args: ['demo-agent'],
      cliEntry: '/tmp/missing-cli.js',
      spawn: spawn as unknown as typeof spawnSync,
      stderr,
    });

    expect(status).toBe(1);
    expect(stderr.write).toHaveBeenCalledWith('spawn failed\n');
  });
});

describe('create-a2a-warp binary scaffolds typechecked templates', () => {
  it('generates every adapter template in temporary directories', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'create-a2a-warp-'));
    const localPackageOverrides = await packLocalPackageOverrides(tempDir);

    for (const template of templates) {
      await execIn(tempDir, process.execPath, [
        createBinary,
        template.name,
        '--adapter',
        template.adapter,
        ...(template.args ?? []),
      ]);

      const projectDir = join(tempDir, template.name);
      await writeLocalPackageOverrides(projectDir, localPackageOverrides);

      const packageJson = await readProjectFile(projectDir, 'package.json');
      const tsconfigJson = await readProjectFile(projectDir, 'tsconfig.json');
      const readme = await readProjectFile(projectDir, 'README.md');
      const envExample = await readProjectFile(projectDir, '.env.example');
      const agentSource = await readProjectFile(projectDir, 'src/agent.ts');
      const indexSource = await readProjectFile(projectDir, 'src/index.ts');

      expect(packageJson).toContain(`"${template.packageDependency}"`);
      expect(packageJson).toContain(`"packageManager": "pnpm@${runtimeVersions.pnpm}"`);
      expect(tsconfigJson).toContain('"module": "NodeNext"');
      expect(readme).toContain(`- Adapter: \`${template.adapter}\``);
      expect(agentSource).toContain(template.sourceMarker);
      expect(indexSource).toContain('process.stdout.write');
      if (template.envMarker) {
        expect(envExample).toContain(template.envMarker);
      }
      if (template.docker) {
        expect(await readProjectFile(projectDir, 'Dockerfile')).toContain('pnpm install');
      }

      await execIn(projectDir, 'pnpm', ['install', '--lockfile-only']);
      await stat(join(projectDir, 'pnpm-lock.yaml'));
      await execIn(projectDir, 'pnpm', ['install', '--frozen-lockfile', '--ignore-scripts']);
      await execIn(projectDir, 'pnpm', ['exec', 'tsc', '-p', 'tsconfig.json', '--noEmit']);
    }
  }, 240_000);
});
