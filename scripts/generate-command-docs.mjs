import { readFileSync, writeFileSync } from 'node:fs';

const commands = ['validate', 'discover', 'send', 'monitor', 'benchmark', 'doctor'];
const source = readFileSync('cli/src/index.ts', 'utf8');
for (const command of commands) {
  if (!source.includes(`.command('${command}')`)) throw new Error(`Missing CLI command ${command}`);
}
writeFileSync(
  'docs/cli/index.md',
  `# CLI\n\nThe CLI binary is \`a2a-warp\`. Commands: ${commands.map((command) => `\`${command}\``).join(', ')}.\n`,
);
