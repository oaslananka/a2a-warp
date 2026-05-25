# Core Package

`@oaslananka/a2a-warp` exports the runtime, client, auth, storage, telemetry, security, and public protocol types.

`TaskManager` keeps the existing synchronous `ITaskStorage` API for in-process stores and current server integrations. `AsyncTaskManager` uses `AsyncTaskStorage` for durable backends that expose promise-based operations.

`AsyncTaskStorage.transaction(callback)` is optional but recommended for read/modify/write task updates. Implementations should serialize the callback, commit if it resolves, and roll back if it throws or rejects. Callback code should only await storage work that belongs to the transaction; keep network calls, timers, and long-running external work outside the transaction boundary.

Existing synchronous stores can be passed through `SyncTaskStorageAdapter` when an async manager is needed. The adapter serializes async calls around the wrapped `ITaskStorage` instance.

`SqliteTaskStorage` and `AsyncSqliteTaskStorage` load `better-sqlite3` only when those storage backends are constructed. Applications that use SQLite storage should install `better-sqlite3` in the application workspace. `AsyncSqliteTaskStorage` wraps transaction callbacks in `BEGIN IMMEDIATE`, `COMMIT`, and `ROLLBACK` and queues operations so concurrent async task mutations do not lose state within one process.
