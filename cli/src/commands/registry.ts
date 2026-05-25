import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Command } from 'commander';
import { RegistryExportDocumentSchema } from '@oaslananka/a2a-warp';
import { RegistryServer } from '@oaslananka/a2a-warp-registry';
import { emitResult, withSpinner, writeOutput, type RootOptionsProvider } from '../io.js';
import { addNetworkOptions, createRegistryClient, type NetworkCommandOptions } from '../network.js';

interface RegistryFileCommandOptions extends NetworkCommandOptions {
  url: string;
  output?: string;
  input?: string;
}

function writeJsonFile(path: string, value: unknown): string {
  const targetPath = resolve(path);
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return targetPath;
}

function readRegistryDocument(path: string): unknown {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function requireFileOption(value: string | undefined, optionName: '--input' | '--output'): string {
  if (!value) {
    throw new Error(`Missing ${optionName}`);
  }
  return value;
}

function formatSchemaIssues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
    .join('; ');
}

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

  registryCommand.addCommand(
    addNetworkOptions(
      new Command('export')
        .option('--url <url>', 'Registry URL', 'http://localhost:3099')
        .requiredOption('--output <file>', 'Write the registry export document to a JSON file'),
    ).action(async (commandOptions: RegistryFileCommandOptions) => {
      const options = getOptions();
      const client = createRegistryClient(commandOptions.url, commandOptions);
      const document = await withSpinner('Exporting registry agents', options, () =>
        client.exportAgents(),
      );
      const output = writeJsonFile(requireFileOption(commandOptions.output, '--output'), document);
      emitResult(
        {
          output,
          schemaVersion: document.schemaVersion,
          agentCount: document.agents.length,
        },
        options,
      );
    }),
  );

  registryCommand.addCommand(
    addNetworkOptions(
      new Command('import')
        .option('--url <url>', 'Registry URL', 'http://localhost:3099')
        .requiredOption('--input <file>', 'Read a registry export document from a JSON file'),
    ).action(async (commandOptions: RegistryFileCommandOptions) => {
      const parsed = RegistryExportDocumentSchema.safeParse(
        readRegistryDocument(requireFileOption(commandOptions.input, '--input')),
      );
      if (!parsed.success) {
        throw new Error(`Invalid registry import file: ${formatSchemaIssues(parsed.error)}`);
      }

      const options = getOptions();
      const client = createRegistryClient(commandOptions.url, commandOptions);
      const result = await withSpinner('Importing registry agents', options, () =>
        client.importAgents(parsed.data),
      );
      emitResult(result, options);
    }),
  );

  return registryCommand;
}
