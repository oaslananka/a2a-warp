import { Command } from 'commander';
import { emitResult, withSpinner, type CliOptions, type RootOptionsProvider } from '../io.js';
import { createCliMessage } from '../message.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';

async function sendMessageToAgent(
  url: string,
  message: string,
  options: CliOptions,
  networkOptions: NetworkCommandOptions,
): Promise<void> {
  const client = createA2AClient(url, networkOptions);
  const result = await withSpinner('Sending task', options, () =>
    client.sendMessage(createCliMessage(message)),
  );
  emitResult(result, options);
}

export function createSendCommand(getOptions: RootOptionsProvider): Command {
  return addNetworkOptions(
    new Command('send')
      .argument('<url>')
      .argument('<message>')
      .action(async (url: string, message: string, commandOptions: NetworkCommandOptions) => {
        await sendMessageToAgent(url, message, getOptions(), commandOptions);
      }),
  );
}
