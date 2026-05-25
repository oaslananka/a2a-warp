import { Command } from 'commander';
import { AgentRegistryClient } from '@oaslananka/a2a-warp';
import { RegistryServer } from '@oaslananka/a2a-warp-registry';
import { emitResult, withSpinner, writeOutput, type RootOptionsProvider } from '../io.js';

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

  registryCommand
    .command('list')
    .option('--url <url>', 'Registry URL', 'http://localhost:3099')
    .action(async (commandOptions: { url: string }) => {
      const options = getOptions();
      const client = new AgentRegistryClient(commandOptions.url);
      const agents = await withSpinner('Listing agents', options, () => client.listAgents());
      emitResult(agents, options);
    });

  return registryCommand;
}
