import { Command } from 'commander';
import { A2AClient } from '@oaslananka/a2a-warp';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { createCliMessage } from '../message.js';
import { createSendCommand } from './send.js';

export function createTaskCommand(getOptions: RootOptionsProvider): Command {
  const taskCommand = new Command('task').description('Task lifecycle commands');

  taskCommand.addCommand(createSendCommand(getOptions));

  taskCommand
    .command('stream')
    .argument('<url>')
    .argument('<message>')
    .action(async (url: string, message: string) => {
      const options = getOptions();
      const client = new A2AClient(url);
      const stream = await client.sendMessageStream(createCliMessage(message));
      for await (const event of stream) {
        emitResult(event, options);
      }
    });

  taskCommand
    .command('status')
    .argument('<url>')
    .argument('<taskId>')
    .action(async (url: string, taskId: string) => {
      const options = getOptions();
      const client = new A2AClient(url);
      const task = await withSpinner('Fetching task status', options, () => client.getTask(taskId));
      emitResult(task, options);
    });

  taskCommand
    .command('cancel')
    .argument('<url>')
    .argument('<taskId>')
    .action(async (url: string, taskId: string) => {
      const options = getOptions();
      const client = new A2AClient(url);
      const task = await withSpinner('Canceling task', options, () => client.cancelTask(taskId));
      emitResult(task, options);
    });

  return taskCommand;
}
