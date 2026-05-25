import { Command } from 'commander';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { createCliMessage } from '../message.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';
import { applyCommandDoc, type CliCommandDoc } from './doc-metadata.js';
import { createSendCommand } from './send.js';

export const taskCommandDoc = {
  path: ['task'],
  summary: 'Run task lifecycle operations.',
  description:
    'Runs task lifecycle operations including send, stream, status lookup, and cancellation against an A2A endpoint.',
  examples: [
    {
      title: 'Send a task message through the task command group.',
      bash: ['a2a-warp task send http://127.0.0.1:3000 "hello"'],
      powershell: ['a2a-warp task send http://127.0.0.1:3000 "hello"'],
    },
    {
      title: 'Stream a task response and inspect task status.',
      bash: [
        'a2a-warp task stream http://127.0.0.1:3000 "hello"',
        'a2a-warp task status http://127.0.0.1:3000 task-123',
      ],
      powershell: [
        'a2a-warp task stream http://127.0.0.1:3000 "hello"',
        'a2a-warp task status http://127.0.0.1:3000 task-123',
      ],
    },
  ],
} satisfies CliCommandDoc;

export function createTaskCommand(getOptions: RootOptionsProvider): Command {
  const taskCommand = applyCommandDoc(new Command('task'), taskCommandDoc);

  taskCommand.addCommand(createSendCommand(getOptions));

  taskCommand.addCommand(
    addNetworkOptions(
      new Command('stream')
        .description('Stream events for a sent task message.')
        .argument('<url>')
        .argument('<message>'),
    ).action(async (url: string, message: string, commandOptions: NetworkCommandOptions) => {
      const options = getOptions();
      const client = createA2AClient(url, commandOptions);
      const stream = await client.sendMessageStream(createCliMessage(message));
      for await (const event of stream) {
        emitResult(event, options);
      }
    }),
  );

  taskCommand.addCommand(
    addNetworkOptions(
      new Command('status')
        .description('Fetch status for an existing task.')
        .argument('<url>')
        .argument('<taskId>'),
    ).action(async (url: string, taskId: string, commandOptions: NetworkCommandOptions) => {
      const options = getOptions();
      const client = createA2AClient(url, commandOptions);
      const task = await withSpinner('Fetching task status', options, () => client.getTask(taskId));
      emitResult(task, options);
    }),
  );

  taskCommand.addCommand(
    addNetworkOptions(
      new Command('cancel')
        .description('Cancel an existing task.')
        .argument('<url>')
        .argument('<taskId>'),
    ).action(async (url: string, taskId: string, commandOptions: NetworkCommandOptions) => {
      const options = getOptions();
      const client = createA2AClient(url, commandOptions);
      const task = await withSpinner('Canceling task', options, () => client.cancelTask(taskId));
      emitResult(task, options);
    }),
  );

  return taskCommand;
}
