import { Command } from 'commander';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { createCliMessage } from '../message.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';
import { createSendCommand } from './send.js';

export function createTaskCommand(getOptions: RootOptionsProvider): Command {
  const taskCommand = new Command('task').description('Task lifecycle commands');

  taskCommand.addCommand(createSendCommand(getOptions));

  taskCommand.addCommand(
    addNetworkOptions(new Command('stream').argument('<url>').argument('<message>')).action(
      async (url: string, message: string, commandOptions: NetworkCommandOptions) => {
        const options = getOptions();
        const client = createA2AClient(url, commandOptions);
        const stream = await client.sendMessageStream(createCliMessage(message));
        for await (const event of stream) {
          emitResult(event, options);
        }
      },
    ),
  );

  taskCommand.addCommand(
    addNetworkOptions(new Command('status').argument('<url>').argument('<taskId>')).action(
      async (url: string, taskId: string, commandOptions: NetworkCommandOptions) => {
        const options = getOptions();
        const client = createA2AClient(url, commandOptions);
        const task = await withSpinner('Fetching task status', options, () =>
          client.getTask(taskId),
        );
        emitResult(task, options);
      },
    ),
  );

  taskCommand.addCommand(
    addNetworkOptions(new Command('cancel').argument('<url>').argument('<taskId>')).action(
      async (url: string, taskId: string, commandOptions: NetworkCommandOptions) => {
        const options = getOptions();
        const client = createA2AClient(url, commandOptions);
        const task = await withSpinner('Canceling task', options, () => client.cancelTask(taskId));
        emitResult(task, options);
      },
    ),
  );

  return taskCommand;
}
