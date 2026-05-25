import { Command } from 'commander';
import { A2AClient } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type CliOptions, type RootOptionsProvider } from '../io.js';
import { createCliMessage } from '../message.js';

async function sendMessageToAgent(
  url: string,
  message: string,
  options: CliOptions,
): Promise<void> {
  const client = new A2AClient(url);
  const result = await withSpinner('Sending task', options, () =>
    client.sendMessage(createCliMessage(message)),
  );
  emitResult(result, options);
}

export function createSendCommand(getOptions: RootOptionsProvider): Command {
  return new Command('send')
    .argument('<url>')
    .argument('<message>')
    .action(async (url: string, message: string) => {
      await sendMessageToAgent(url, message, getOptions());
    });
}
