import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createProgram } from '../src/index.js';

const repoRoot = resolve(import.meta.dirname, '../..');

function readRepoFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

function topLevelCommandNames(): string[] {
  return createProgram()
    .commands.map((command) => command.name())
    .sort();
}

describe('generated CLI command documentation', () => {
  it('generates command docs from the live Commander program instead of source-string checks', () => {
    const generator = readRepoFile('scripts/generate-command-docs.mjs');

    expect(generator).toContain('createProgram');
    expect(generator).not.toContain("readFileSync('cli/src/index.ts'");
    expect(generator).not.toContain("const commands = ['validate'");
  });

  it('keeps canonical and docs-site command pages in parity with live CLI commands', () => {
    for (const commandName of topLevelCommandNames()) {
      const canonicalPath = `docs/cli/${commandName}.md`;
      const docsSitePath = `docs-site/cli/${commandName}.md`;

      expect(existsSync(resolve(repoRoot, canonicalPath)), `${canonicalPath} missing`).toBe(true);
      expect(existsSync(resolve(repoRoot, docsSitePath)), `${docsSitePath} missing`).toBe(true);

      for (const path of [canonicalPath, docsSitePath]) {
        const text = readRepoFile(path);
        expect(text).toContain(`# a2a-warp ${commandName}`);
        expect(text).toContain('<!-- Synced from scripts/generate-command-docs.mjs. -->');
        expect(text).toContain('```bash');
        expect(text).toContain('```powershell');
      }
    }
  });
});
