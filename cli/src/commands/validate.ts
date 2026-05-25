import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { normalizeAgentCard } from '@oaslananka/a2a-warp';
import { emitResult, writeError, type RootOptionsProvider } from '../io.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createValidateCommand(getOptions: RootOptionsProvider): Command {
  return addNetworkOptions(new Command('validate').argument('<target>')).action(
    async (target: string, commandOptions: NetworkCommandOptions) => {
      const options = getOptions();

      try {
        if (isHttpUrl(target)) {
          const client = createA2AClient(target, commandOptions);
          emitResult(normalizeAgentCard(await client.resolveCard()), options);
          return;
        }

        const card = JSON.parse(readFileSync(resolve(target), 'utf8')) as Parameters<
          typeof normalizeAgentCard
        >[0];
        emitResult(normalizeAgentCard(card), options);
      } catch (error) {
        writeError(`Validation failed: ${String(error)}`);
        process.exitCode = 1;
      }
    },
  );
}
