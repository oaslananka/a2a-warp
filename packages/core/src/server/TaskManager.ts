/**
 * @file TaskManager.ts
 * Task lifecycle manager backed by a pluggable storage engine.
 */

import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { InMemoryTaskStorage } from '../storage/InMemoryTaskStorage.js';
import type { ITaskStorage } from '../storage/ITaskStorage.js';
import type {
  ExtensibleArtifact,
  Message,
  PushNotificationConfig,
  Task,
  TaskCounts,
  TaskState,
  TaskStateInput,
  TerminalTaskState,
} from '../types/task.js';
import { normalizeMessage, normalizeTaskState, taskStateMetadataKey } from '../utils/compat.js';

export type TaskUpdateReason = 'created' | 'message' | 'artifact' | 'state' | 'push-config';

export type TaskLifecycleErrorCode = 'INVALID_TASK_TRANSITION' | 'TASK_TERMINAL' | 'TASK_NOT_FOUND';

export class TaskLifecycleError extends Error {
  constructor(
    readonly code: TaskLifecycleErrorCode,
    message: string,
    readonly taskId?: string,
    readonly currentState?: TaskState,
    readonly nextState?: TaskState,
  ) {
    super(message);
  }
}

export interface TaskUpdatedEvent {
  task: Task;
  reason: TaskUpdateReason;
  previousState?: TaskState;
}

const TERMINAL_TASK_STATES = new Set<TerminalTaskState>(['COMPLETED', 'FAILED', 'CANCELED']);

const TASK_TRANSITIONS: Record<TaskState, ReadonlySet<TaskState>> = {
  SUBMITTED: new Set([
    'SUBMITTED',
    'QUEUED',
    'WORKING',
    'INPUT_REQUIRED',
    'WAITING_ON_EXTERNAL',
    'COMPLETED',
    'FAILED',
    'CANCELED',
  ]),
  QUEUED: new Set([
    'QUEUED',
    'WORKING',
    'INPUT_REQUIRED',
    'WAITING_ON_EXTERNAL',
    'COMPLETED',
    'FAILED',
    'CANCELED',
  ]),
  WORKING: new Set([
    'WORKING',
    'INPUT_REQUIRED',
    'WAITING_ON_EXTERNAL',
    'COMPLETED',
    'FAILED',
    'CANCELED',
  ]),
  INPUT_REQUIRED: new Set([
    'INPUT_REQUIRED',
    'WORKING',
    'WAITING_ON_EXTERNAL',
    'COMPLETED',
    'FAILED',
    'CANCELED',
  ]),
  WAITING_ON_EXTERNAL: new Set([
    'WAITING_ON_EXTERNAL',
    'WORKING',
    'INPUT_REQUIRED',
    'COMPLETED',
    'FAILED',
    'CANCELED',
  ]),
  COMPLETED: new Set(),
  FAILED: new Set(),
  CANCELED: new Set(),
};

function isTerminalTaskState(state: TaskState): state is TerminalTaskState {
  return TERMINAL_TASK_STATES.has(state as TerminalTaskState);
}

export class TaskManager extends EventEmitter {
  constructor(private readonly storage: ITaskStorage = new InMemoryTaskStorage()) {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Creates a new task and stores it in memory.
   *
   * @param sessionId Optional session identifier.
   * @param contextId Optional conversation context identifier.
   * @returns Newly created task.
   */
  createTask(
    sessionId?: string,
    contextId?: string,
    principalId?: string,
    tenantId?: string,
  ): Task {
    const createdAt = new Date().toISOString();
    const task: Task = {
      kind: 'task',
      id: randomUUID(),
      status: {
        state: 'SUBMITTED',
        timestamp: createdAt,
      },
      history: [],
      artifacts: [],
      extensions: [],
      metadata: {
        createdAt,
      },
      ...(sessionId ? { sessionId } : {}),
      ...(contextId ? { contextId } : {}),
      ...(principalId ? { principalId } : {}),
      ...(tenantId ? { tenantId } : {}),
    };

    const storedTask = this.storage.insertTask(task);
    this.emitTaskUpdated(storedTask, 'created');
    return storedTask;
  }

  getTask(taskId: string): Task | undefined {
    return this.storage.getTask(taskId);
  }

  getAllTasks(): Task[] {
    return this.storage.getAllTasks();
  }

  getTasksByContext(contextId: string): Task[] {
    return this.storage.getTasksByContextId(contextId);
  }

  getTasksByContextId(contextId: string): Task[] {
    return this.getTasksByContext(contextId);
  }

  addHistoryMessage(taskId: string, message: Message): Task | undefined {
    const task = this.storage.getTask(taskId);
    if (!task) {
      return undefined;
    }
    this.assertTaskMutable(task, 'append history');

    task.history.push({
      ...normalizeMessage(message),
      ...((message.contextId ?? task.contextId)
        ? { contextId: message.contextId ?? task.contextId }
        : {}),
    });
    this.storage.saveTask(task);
    this.emitTaskUpdated(task, 'message');
    return task;
  }

  addArtifact(taskId: string, artifact: ExtensibleArtifact): Task | undefined {
    const task = this.storage.getTask(taskId);
    if (!task) {
      return undefined;
    }
    this.assertTaskMutable(task, 'append artifact');

    const nextArtifact: ExtensibleArtifact = {
      ...artifact,
      ...((artifact.extensions ?? task.extensions)
        ? { extensions: artifact.extensions ?? task.extensions }
        : {}),
      metadata: {
        ...(artifact.metadata ?? {}),
        ...(task.contextId ? { contextId: task.contextId } : {}),
      },
    };
    task.artifacts = [...(task.artifacts ?? []), nextArtifact];
    this.storage.saveTask(task);
    this.emitTaskUpdated(task, 'artifact');
    return task;
  }

  updateTaskState(
    taskId: string,
    state: TaskStateInput,
    historyMessage?: Message,
    metadata?: Record<string, unknown>,
  ): Task | undefined {
    const task = this.storage.getTask(taskId);
    if (!task) {
      return undefined;
    }
    const previousState = task.status.state;
    const nextState = normalizeTaskState(state);
    this.assertTransition(task, nextState);

    const timestamp = new Date().toISOString();
    task.status = {
      state: nextState,
      timestamp,
      ...(typeof metadata?.['message'] === 'string' ? { message: metadata['message'] } : {}),
    };
    if (historyMessage) {
      task.history.push({
        ...normalizeMessage(historyMessage),
        ...((historyMessage.contextId ?? task.contextId)
          ? { contextId: historyMessage.contextId ?? task.contextId }
          : {}),
      });
    }
    const nextMetadata = { ...(task.metadata ?? {}), ...(metadata ?? {}) };
    if (nextState === 'WORKING' && typeof nextMetadata['startedAt'] !== 'string') {
      nextMetadata['startedAt'] = timestamp;
    }
    if (isTerminalTaskState(nextState)) {
      nextMetadata['endedAt'] = timestamp;
      nextMetadata[taskStateMetadataKey(nextState)] = timestamp;
      const startedAtValue =
        typeof nextMetadata['startedAt'] === 'string'
          ? Date.parse(nextMetadata['startedAt'])
          : typeof nextMetadata['createdAt'] === 'string'
            ? Date.parse(nextMetadata['createdAt'])
            : Number.NaN;
      const endedAtValue = Date.parse(timestamp);
      if (Number.isFinite(startedAtValue) && Number.isFinite(endedAtValue)) {
        nextMetadata['durationMs'] = Math.max(endedAtValue - startedAtValue, 0);
      }
    }
    task.metadata = nextMetadata;
    this.storage.saveTask(task);
    this.emitTaskUpdated(task, 'state', previousState);
    return task;
  }

  cancelTask(taskId: string): Task | undefined {
    return this.updateTaskState(taskId, 'CANCELED');
  }

  setPushNotification(
    taskId: string,
    config: PushNotificationConfig,
  ): PushNotificationConfig | undefined {
    const task = this.storage.getTask(taskId);
    if (!task) {
      return undefined;
    }
    this.assertTaskMutable(task, 'set push notification');

    const storedConfig = this.storage.setPushNotification(taskId, config);
    this.emitTaskUpdated(task, 'push-config');
    return storedConfig;
  }

  getPushNotification(taskId: string): PushNotificationConfig | undefined {
    return this.storage.getPushNotification(taskId);
  }

  setTaskExtensions(taskId: string, extensions: string[]): Task | undefined {
    const task = this.storage.getTask(taskId);
    if (!task) {
      return undefined;
    }
    this.assertTaskMutable(task, 'set extensions');

    task.extensions = extensions;
    this.storage.saveTask(task);
    return task;
  }

  getTaskCounts(): TaskCounts {
    return this.storage.getAllTasks().reduce<TaskCounts>(
      (counts, task) => {
        counts.total += 1;
        switch (task.status.state) {
          case 'SUBMITTED':
            counts.submitted += 1;
            counts.active += 1;
            break;
          case 'QUEUED':
            counts.queued += 1;
            counts.active += 1;
            break;
          case 'WORKING':
            counts.working += 1;
            counts.active += 1;
            break;
          case 'WAITING_ON_EXTERNAL':
            counts.waitingOnExternal += 1;
            counts.active += 1;
            break;
          case 'INPUT_REQUIRED':
            counts.inputRequired += 1;
            counts.active += 1;
            break;
          case 'COMPLETED':
            counts.completed += 1;
            break;
          case 'FAILED':
            counts.failed += 1;
            break;
          case 'CANCELED':
            counts.canceled += 1;
            break;
        }
        return counts;
      },
      {
        total: 0,
        active: 0,
        completed: 0,
        failed: 0,
        canceled: 0,
        submitted: 0,
        queued: 0,
        inputRequired: 0,
        waitingOnExternal: 0,
        working: 0,
      },
    );
  }

  private emitTaskUpdated(task: Task, reason: TaskUpdateReason, previousState?: TaskState): void {
    this.emit('taskUpdated', {
      task: structuredClone(task),
      reason,
      ...(previousState ? { previousState } : {}),
    } satisfies TaskUpdatedEvent);
  }

  private assertTaskMutable(task: Task, action: string): void {
    if (isTerminalTaskState(task.status.state)) {
      throw new TaskLifecycleError(
        'TASK_TERMINAL',
        `Cannot ${action} for terminal task ${task.id} in state ${task.status.state}`,
        task.id,
        task.status.state,
      );
    }
  }

  private assertTransition(task: Task, nextState: TaskState): void {
    const currentState = task.status.state;
    if (isTerminalTaskState(currentState)) {
      throw new TaskLifecycleError(
        'TASK_TERMINAL',
        `Task ${task.id} is already terminal in state ${currentState}`,
        task.id,
        currentState,
        nextState,
      );
    }

    if (TASK_TRANSITIONS[currentState].has(nextState)) {
      return;
    }

    throw new TaskLifecycleError(
      'INVALID_TASK_TRANSITION',
      `Invalid task transition from ${currentState} to ${nextState} for task ${task.id}`,
      task.id,
      currentState,
      nextState,
    );
  }
}
