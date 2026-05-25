import { Command } from 'commander';
import { A2AClient, type AgentSkill } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';

export async function discoverAgent(url: string, options: { json?: boolean } = {}) {
  const client = new A2AClient(url);
  const card = await client.resolveCard();

  if (!options.json) {
    process.stdout.write(`\nDiscovered Agent Card for: ${card.name} v${card.version}\n`);
    process.stdout.write(`URL: ${card.url}\n`);
    process.stdout.write(`Description: ${card.description}\n`);
    process.stdout.write('Skills:\n');
    if (card.skills) {
      card.skills.forEach((skill: AgentSkill) => {
        process.stdout.write(`  - ${skill.name} [${(skill.tags || []).join(', ')}]\n`);
      });
    } else {
      process.stdout.write('  (None)\n');
    }
  }

  return card;
}

export function createDiscoverCommand(getOptions: RootOptionsProvider): Command {
  return new Command('discover').argument('<url>').action(async (url: string) => {
    const options = getOptions();
    const card = await withSpinner(`Discovering ${url}`, options, () =>
      discoverAgent(url, options),
    );
    if (options.json) {
      emitResult(card, options);
    }
  });
}
