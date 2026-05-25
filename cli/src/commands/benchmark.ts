import { Command } from 'commander';
import { emitResult, withSpinner, type RootOptionsProvider } from '../io.js';
import { createCliMessage } from '../message.js';
import { addNetworkOptions, createA2AClient, type NetworkCommandOptions } from '../network.js';

interface BenchmarkCommandOptions extends NetworkCommandOptions {
  requests: string;
  concurrency: string;
  message: string;
}

async function benchmarkAgent(
  url: string,
  commandOptions: BenchmarkCommandOptions,
): Promise<Record<string, number>> {
  const client = createA2AClient(url, commandOptions);
  const requests = Number(commandOptions.requests);
  const concurrency = Number(commandOptions.concurrency);
  const message = commandOptions.message;
  const latencies: number[] = [];
  let cursor = 0;
  let completed = 0;
  let failed = 0;
  const startedAt = Date.now();

  const worker = async (): Promise<void> => {
    while (cursor < requests) {
      const nextRequest = cursor;
      cursor += 1;
      const requestStartedAt = Date.now();
      try {
        await client.sendMessage(createCliMessage(`${message} #${nextRequest + 1}`));
        latencies.push(Date.now() - requestStartedAt);
        completed += 1;
      } catch {
        failed += 1;
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const totalDurationMs = Date.now() - startedAt;
  const averageLatencyMs =
    latencies.length > 0
      ? Number((latencies.reduce((sum, value) => sum + value, 0) / latencies.length).toFixed(2))
      : 0;

  return {
    requests,
    concurrency,
    completed,
    failed,
    averageLatencyMs,
    totalDurationMs,
  };
}

export function createBenchmarkCommand(getOptions: RootOptionsProvider): Command {
  return addNetworkOptions(
    new Command('benchmark')
      .argument('<url>')
      .option('--requests <count>', 'Number of requests to send', '25')
      .option('--concurrency <count>', 'Number of concurrent workers', '5')
      .option('--message <message>', 'Benchmark message text', 'benchmark ping')
      .action(async (url: string, commandOptions: BenchmarkCommandOptions) => {
        const options = getOptions();
        const result = await withSpinner('Running benchmark', options, () =>
          benchmarkAgent(url, commandOptions),
        );
        emitResult(result, options);
      }),
  );
}
