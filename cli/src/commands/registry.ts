import { Command } from 'commander';
import { RegistryServer } from '@oaslananka/a2a-warp-registry';
import { emitResult, withSpinner, writeOutput, type RootOptionsProvider } from '../io.js';
import { addNetworkOptions, createRegistryClient, type NetworkCommandOptions } from '../network.js';

export function createRegistryCommand(getOptions: RootOptionsProvider): Command {
  const registryCommand = new Command('registry').description('Registry operations');

  registryCommand
    .command('start')
    .option('--port <port>', 'Port to listen on', '3099')
    .action((commandOptions: { port: string }) => {
      const server = new RegistryServer();
      server.start(Number(commandOptions.port));
      writeOutput(`Registry listening on ${commandOptions.port}`);
    });

  registryCommand.addCommand(
    addNetworkOptions(
      new Command('list').option('--url <url>', 'Registry URL', 'http://localhost:3099'),
    ).action(async (commandOptions: { url: string } & NetworkCommandOptions) => {
      const options = getOptions();
      const client = createRegistryClient(commandOptions.url, commandOptions);
      const agents = await withSpinner('Listing agents', options, () => client.listAgents());
      emitResult(agents, options);
    }),
  );

  return registryCommand;
}
