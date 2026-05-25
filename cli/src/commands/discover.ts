import { Command } from 'commander';
import { type AgentSkill } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';

export async function discoverAgent(
  url: string,
  options: { json?: boolean } = {},
  networkOptions: NetworkCommandOptions = {},
) {
  const client = createA2AClient(url, networkOptions);
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
  return addNetworkOptions(new Command('discover').argument('<url>')).action(
    async (url: string, commandOptions: NetworkCommandOptions) => {
      const options = getOptions();
      const card = await withSpinner(`Discovering ${url}`, options, () =>
        discoverAgent(url, options, commandOptions),
      );
      if (options.json) {
        emitResult(card, options);
      }
    },
  );
}
