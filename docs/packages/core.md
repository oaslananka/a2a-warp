# Core Package

`@oaslananka/a2a-warp` exports the runtime, client, auth, storage, telemetry, security, and public protocol types.

`SqliteTaskStorage` loads `better-sqlite3` only when that storage backend is constructed. Applications that use SQLite storage should install `better-sqlite3` in the application workspace.
