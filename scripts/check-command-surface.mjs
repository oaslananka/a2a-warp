import { readJson, readText, fail } from './check-utils.mjs';

const source = readText('cli/src/index.ts');
const generatedVersion = readText('cli/src/generated/version.ts');
const cliPackage = readJson('cli/package.json');
const required = ['validate', 'discover', 'send', 'monitor', 'benchmark', 'doctor'];
const failures = [];
if (!source.includes(".name('a2a-warp')")) failures.push('CLI program name must be a2a-warp');
for (const command of required) {
  if (!source.includes(`.command('${command}')`)) failures.push(`missing CLI command ${command}`);
}
if (!source.includes('.version(CLI_VERSION)')) failures.push('CLI version must use CLI_VERSION');
if (!source.includes('version: CLI_VERSION')) failures.push('doctor version must use CLI_VERSION');
if (/\.version\('\d+\.\d+\.\d+'\)/.test(source) || /version:\s*'\d+\.\d+\.\d+'/.test(source)) {
  failures.push('CLI version must not be hard-coded in cli/src/index.ts');
}
if (!generatedVersion.includes(`generatedCliVersion = '${cliPackage.version}'`)) {
  failures.push('generated CLI version must match cli/package.json');
}
if (failures.length > 0) fail('CLI command surface validation failed.', failures);
