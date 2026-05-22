import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const nodePath = process.execPath;
const cliEntry = resolve(process.cwd(), 'cli', 'dist', 'index.js');

describe('a2a CLI', () => {
  it('prints help output', async () => {
    const { stdout } = await execFileAsync(nodePath, [cliEntry, '--help'], {
      cwd: process.cwd(),
    });

    expect(stdout).toContain('A2A Warp developer CLI');
    expect(stdout).toContain('a2a-warp');
    expect(stdout).toContain('send');
    expect(stdout).toContain('doctor');
    expect(stdout).toContain('task');
    expect(stdout).toContain('registry');
  });

  it('prints the launch version', async () => {
    const { stdout } = await execFileAsync(nodePath, [cliEntry, '--version'], {
      cwd: process.cwd(),
    });

    expect(stdout.trim()).toBe('1.0.0');
  });

  it('reports local doctor diagnostics as JSON', async () => {
    const { stdout } = await execFileAsync(nodePath, [cliEntry, '--json', 'doctor'], {
      cwd: process.cwd(),
    });

    const payload = JSON.parse(stdout);
    expect(payload.cli).toBe('a2a-warp');
    expect(payload.version).toBe('1.0.0');
    expect(payload.node).toMatch(/^v/);
    expect(payload.platform).toBe(process.platform);
  });

  it('validates an agent card and emits JSON', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'a2a-cli-validate-'));
    const cardPath = join(tempDir, 'agent-card.json');
    await writeFile(
      cardPath,
      JSON.stringify({
        protocolVersion: '0.3',
        name: 'Legacy Agent',
        description: 'desc',
        url: 'http://localhost:3000',
        version: '1.0.0',
      }),
      'utf8',
    );

    const { stdout } = await execFileAsync(nodePath, [cliEntry, '--json', 'validate', cardPath], {
      cwd: process.cwd(),
    });

    const payload = JSON.parse(stdout);
    expect(payload.protocolVersion).toBe('1.0');
    expect(payload.name).toBe('Legacy Agent');
  }, 15000);

  it('scaffolds a new agent project', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'a2a-cli-scaffold-'));

    const { stdout } = await execFileAsync(nodePath, [cliEntry, 'scaffold', 'sample-agent'], {
      cwd: tempDir,
    });

    expect(stdout).toContain('Scaffold complete!');

    const packageJson = await readFile(join(tempDir, 'sample-agent', 'package.json'), 'utf8');
    const tsconfigJson = await readFile(join(tempDir, 'sample-agent', 'tsconfig.json'), 'utf8');
    const agentFile = await readFile(join(tempDir, 'sample-agent', 'src', 'agent.ts'), 'utf8');
    const indexFile = await readFile(join(tempDir, 'sample-agent', 'src', 'index.ts'), 'utf8');
    expect(packageJson).toContain('"@oaslananka/a2a-warp"');
    expect(packageJson).toContain('"@types/node"');
    expect(tsconfigJson).toContain('"types"');
    expect(tsconfigJson).toContain('"node"');
    expect(agentFile).toContain('BaseAdapter');
    expect(indexFile).toContain("import { createAgent } from './agent.js';");
  }, 15000);
});
