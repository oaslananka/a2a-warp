import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const commands = ['validate', 'discover', 'send', 'monitor', 'benchmark', 'doctor'];
const source = [
  readFileSync('cli/src/index.ts', 'utf8'),
  ...readdirSync('cli/src/commands')
    .filter((file) => file.endsWith('.ts'))
    .map((file) => readFileSync(join('cli/src/commands', file), 'utf8')),
].join('\n');
for (const command of commands) {
  if (!source.includes(`.command('${command}')`) && !source.includes(`new Command('${command}')`)) {
    throw new Error(`Missing CLI command ${command}`);
  }
}
writeFileSync(
  'docs/cli/index.md',
  `# CLI\n\nThe CLI binary is \`a2a-warp\`. Commands: ${commands.map((command) => `\`${command}\``).join(', ')}.\n`,
);
