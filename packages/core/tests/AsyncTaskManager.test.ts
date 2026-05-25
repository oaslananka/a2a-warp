import { describe, expect, it } from 'vitest';
import { AsyncTaskManager } from '../src/server/AsyncTaskManager.js';
import { SyncTaskStorageAdapter } from '../src/storage/AsyncTaskStorage.js';
import { InMemoryTaskStorage } from '../src/storage/InMemoryTaskStorage.js';
import type { Message } from '../src/types/task.js';

function createMessage(index: number): Message {
  return {
    role: 'user',
    messageId: `message-${index}`,
    timestamp: new Date().toISOString(),
    parts: [{ type: 'text', text: `message ${index}` }],
  };
}

describe('AsyncTaskManager', () => {
  it('preserves all history updates when async mutations run concurrently', async () => {
    const manager = new AsyncTaskManager(new SyncTaskStorageAdapter(new InMemoryTaskStorage()));
    const task = await manager.createTask('session-1', 'context-1');

    await Promise.all(
      Array.from({ length: 25 }, (_, index) =>
        manager.addHistoryMessage(task.id, createMessage(index)),
      ),
    );

    const storedTask = await manager.getTask(task.id);
    expect(storedTask?.history).toHaveLength(25);
    expect(new Set(storedTask?.history.map((message) => message.messageId)).size).toBe(25);
  });

  it('adapts existing synchronous task storage without changing stored task semantics', async () => {
    const syncStorage = new InMemoryTaskStorage();
    const storage = new SyncTaskStorageAdapter(syncStorage);
    const manager = new AsyncTaskManager(storage);

    const task = await manager.createTask(undefined, 'context-adapter');
    await manager.setTaskExtensions(task.id, ['urn:test:extension']);
    await manager.setPushNotification(task.id, { url: 'https://example.com/hook' });

    expect(await storage.count()).toBe(1);
    expect(await manager.getTasksByContextId('context-adapter')).toHaveLength(1);
    expect(syncStorage.getTask(task.id)?.extensions).toEqual(['urn:test:extension']);
    expect(await manager.getPushNotification(task.id)).toEqual({
      url: 'https://example.com/hook',
    });
  });
});
