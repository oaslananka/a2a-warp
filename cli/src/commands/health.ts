import { Command } from 'commander';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';

export function createHealthCommand(getOptions: RootOptionsProvider): Command {
  return addNetworkOptions(new Command('health').argument('<url>')).action(
    async (url: string, commandOptions: NetworkCommandOptions) => {
      const options = getOptions();
      const client = createA2AClient(url, commandOptions);
      const health = await withSpinner('Checking health', options, () => client.health());
      emitResult(health, options);
    },
  );
}
