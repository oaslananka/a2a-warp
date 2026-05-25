import { Command } from 'commander';
import { emitResult, type RootOptionsProvider } from '../io.js';
import { CLI_VERSION } from '../version.js';

export function createDoctorCommand(getOptions: RootOptionsProvider): Command {
  return new Command('doctor').action(() => {
    emitResult(
      {
        cli: 'a2a-warp',
        version: CLI_VERSION,
        node: process.version,
        platform: process.platform,
      },
      getOptions(),
    );
  });
}
