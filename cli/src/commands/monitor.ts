import { Command } from 'commander';
import { A2AClient } from '@oaslananka/a2a-warp';
import { emitResult, type CliOptions, type RootOptionsProvider } from '../io.js';

interface MonitorCommandOptions {
  interval: string;
  cycles?: string;
  limit: string;
  contextId?: string;
}

interface MonitoredTask {
  id: string;
  contextId?: string;
  status: {
    state: string;
    timestamp: string;
  };
}

interface TaskListSnapshot {
  tasks: MonitoredTask[];
  total: number;
}

async function monitorTasks(
  url: string,
  commandOptions: MonitorCommandOptions,
  options: CliOptions,
): Promise<void> {
  const client = new A2AClient(url) as A2AClient & {
    listTasks(params: {
      contextId?: string;
      limit?: number;
      offset?: number;
    }): Promise<TaskListSnapshot>;
  };
  const intervalMs = Number(commandOptions.interval);
  const cycles = commandOptions.cycles ? Number(commandOptions.cycles) : Number.POSITIVE_INFINITY;
  const limit = Number(commandOptions.limit);

  let completedCycles = 0;
  while (completedCycles < cycles) {
    const snapshot = await client.listTasks({
      ...(commandOptions.contextId ? { contextId: commandOptions.contextId } : {}),
      limit,
      offset: 0,
    });
    emitResult(
      {
        timestamp: new Date().toISOString(),
        total: snapshot.total,
        tasks: snapshot.tasks.map((task: MonitoredTask) => ({
          id: task.id,
          contextId: task.contextId,
          state: task.status.state,
          updatedAt: task.status.timestamp,
        })),
      },
      options,
    );
    completedCycles += 1;
    if (completedCycles < cycles) {
      await new Promise<void>((resolvePromise) => {
        setTimeout(resolvePromise, intervalMs);
      });
    }
  }
}

export function createMonitorCommand(getOptions: RootOptionsProvider): Command {
  return new Command('monitor')
    .argument('<url>')
    .option('--interval <ms>', 'Polling interval in milliseconds', '2000')
    .option('--cycles <count>', 'Number of polling cycles before exit')
    .option('--limit <count>', 'Number of tasks to fetch', '50')
    .option('--context-id <contextId>', 'Filter tasks by context id')
    .action(async (url: string, commandOptions: MonitorCommandOptions) => {
      await monitorTasks(url, commandOptions, getOptions());
    });
}
