import { Command } from 'commander';
import { A2AClient } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';

export function createHealthCommand(getOptions: RootOptionsProvider): Command {
  return new Command('health').argument('<url>').action(async (url: string) => {
    const options = getOptions();
    const client = new A2AClient(url);
    const health = await withSpinner('Checking health', options, () => client.health());
    emitResult(health, options);
  });
}
