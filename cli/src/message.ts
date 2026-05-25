import { randomUUID } from 'node:crypto';
import type { Message } from '@oaslananka/a2a-warp';

export function createCliMessage(text: string): Message {
  return {
    role: 'user',
    parts: [{ type: 'text', text }],
    messageId: `cli-${randomUUID()}`,
    timestamp: new Date().toISOString(),
  };
}
