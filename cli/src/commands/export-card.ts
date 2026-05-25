import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { type AgentCard } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';

interface ExportCardCommandOptions extends NetworkCommandOptions {
  output: string;
}

export function createExportCardCommand(getOptions: RootOptionsProvider): Command {
  return addNetworkOptions(
    new Command('export-card')
      .argument('<url>')
      .option('--output <path>', 'Output path', 'agent-card.json')
      .action(async (url: string, commandOptions: ExportCardCommandOptions) => {
        const options = getOptions();
        const client = createA2AClient(url, commandOptions);
        const card = await withSpinner<AgentCard>('Exporting agent card', options, () =>
          client.resolveCard(),
        );
        writeFileSync(resolve(commandOptions.output), JSON.stringify(card, null, 2));
        emitResult({ output: resolve(commandOptions.output), name: card.name }, options);
      }),
  );
}
