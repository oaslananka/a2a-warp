import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readJson, readText, fail } from './check-utils.mjs';

const indexSource = readText('cli/src/index.ts');
const commandSource = readdirSync('cli/src/commands')
  .filter((file) => file.endsWith('.ts'))
  .map((file) => readText(join('cli/src/commands', file)))
  .join('\n');
const source = `${indexSource}\n${commandSource}`;
const generatedVersion = readText('cli/src/generated/version.ts');
const cliPackage = readJson('cli/package.json');
const required = [
  'discover',
  'scaffold',
  'task',
  'send',
  'registry',
  'health',
  'validate',
  'monitor',
  'benchmark',
  'doctor',
  'export-card',
];
const semverLiteral = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?`;
const quotedSemverLiteral = String.raw`["']${semverLiteral}["']`;
const failures = [];
if (!indexSource.includes(".name('a2a-warp')")) failures.push('CLI program name must be a2a-warp');
for (const command of required) {
  if (!source.includes(`.command('${command}')`) && !source.includes(`new Command('${command}')`)) {
    failures.push(`missing CLI command ${command}`);
  }
}
if (!indexSource.includes('.version(CLI_VERSION)'))
  failures.push('CLI version must use CLI_VERSION');
if (!source.includes('version: CLI_VERSION')) failures.push('doctor version must use CLI_VERSION');
if (
  new RegExp(String.raw`\.version\(${quotedSemverLiteral}\)`).test(indexSource) ||
  new RegExp(String.raw`version:\s*${quotedSemverLiteral}`).test(indexSource)
) {
  failures.push('CLI version must not be hard-coded in cli/src/index.ts');
}
if (!generatedVersion.includes(`generatedCliVersion = '${cliPackage.version}'`)) {
  failures.push('generated CLI version must match cli/package.json');
}
if (failures.length > 0) fail('CLI command surface validation failed.', failures);
