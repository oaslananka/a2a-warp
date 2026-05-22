import { readText, fail } from './check-utils.mjs';

const source = readText('cli/src/index.ts');
const required = ['validate', 'discover', 'send', 'monitor', 'benchmark', 'doctor'];
const failures = [];
if (!source.includes(".name('a2a-warp')")) failures.push('CLI program name must be a2a-warp');
for (const command of required) {
  if (!source.includes(`.command('${command}')`)) failures.push(`missing CLI command ${command}`);
}
if (!source.includes(".version('1.0.0')")) failures.push('CLI version must be 1.0.0');
if (failures.length > 0) fail('CLI command surface validation failed.', failures);
