import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { A2AClient, type AgentCard } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';

interface ExportCardCommandOptions {
  output: string;
}

export function createExportCardCommand(getOptions: RootOptionsProvider): Command {
  return new Command('export-card')
    .argument('<url>')
    .option('--output <path>', 'Output path', 'agent-card.json')
    .action(async (url: string, commandOptions: ExportCardCommandOptions) => {
      const options = getOptions();
      const client = new A2AClient(url);
      const card = await withSpinner<AgentCard>('Exporting agent card', options, () =>
        client.resolveCard(),
      );
      writeFileSync(resolve(commandOptions.output), JSON.stringify(card, null, 2));
      emitResult({ output: resolve(commandOptions.output), name: card.name }, options);
    });
}
