/**
 * @file BaseAdapter.ts
 * Abstract base adapter for A2A implementations.
 */

import { A2AServer, normalizeAgentCard } from '@oaslananka/a2a-warp';
import type { A2AServerOptions, AnyAgentCard, Artifact, Message, Task } from '@oaslananka/a2a-warp';

export abstract class BaseAdapter extends A2AServer {
  constructor(card: AnyAgentCard, options: A2AServerOptions = {}) {
    super(normalizeAgentCard(card), options);
  }

  /**
   * Must handle a single task and return generated artifacts.
   */
  abstract override handleTask(task: Task, message: Message): Promise<Artifact[]>;
}
