import { describe, expect, it } from 'vitest';
import { createRegistryCommand } from '../src/commands/registry.js';
import { commandNames, expectCommandHelp, jsonOptions } from './command-test-helpers.js';

describe('registry command', () => {
  it('defines the registry command group and subcommands', () => {
    const command = createRegistryCommand(jsonOptions);

    expect(command.name()).toBe('registry');
    expect(commandNames(command)).toEqual(['start', 'list']);
    expectCommandHelp(command, ['Registry operations', 'start', 'list']);
  });
});
