import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { A2AClient, normalizeAgentCard } from '@oaslananka/a2a-warp';
import { emitResult, writeError, type RootOptionsProvider } from '../io.js';

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createValidateCommand(getOptions: RootOptionsProvider): Command {
  return new Command('validate').argument('<target>').action(async (target: string) => {
    const options = getOptions();

    try {
      if (isHttpUrl(target)) {
        const client = new A2AClient(target);
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
  });
}
