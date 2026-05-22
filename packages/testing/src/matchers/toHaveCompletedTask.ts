import type { Task } from '@oaslananka/a2a-warp';

export function toHaveCompletedTask(received: Task) {
  const pass = received.status.state === 'COMPLETED';

  return {
    pass,
    message: () =>
      pass
        ? `expected task ${received.id} not to be completed`
        : `expected task ${received.id} to be completed, received ${received.status.state}`,
  };
}
