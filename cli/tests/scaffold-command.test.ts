import { describe, expect, it } from 'vitest';
import { createScaffoldCommand } from '../src/commands/scaffold.js';
import { expectCommandHelp } from './command-test-helpers.js';

describe('scaffold command', () => {
  it('defines the scaffold command and template options', () => {
    const command = createScaffoldCommand();

    expect(command.name()).toBe('scaffold');
    expectCommandHelp(command, [
      'scaffold [options] <agent-name>',
      '--adapter <adapter>',
      '--auth',
      '--rate-limit',
      '--docker',
    ]);
  });
});
