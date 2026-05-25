# Registry Package

`@oaslananka/a2a-warp-registry` contains registry server, discovery, matching, and storage helpers.

## Export And Import

The registry exposes authenticated control-plane endpoints for backup and restore:

- `GET /admin/agents/export`
- `POST /admin/agents/import`

Export responses use the versioned `registry-export.schema.json` document described in `docs/protocol/schemas.md`. Imports validate the document, preserve tenant/public metadata, and are idempotent when records match existing agents by `id` or `url`.

## Redis Indexes

`RedisStorage` still accepts the original minimal client contract with `get`, `set`, and `del`. That path stores index members as JSON arrays and is intended for tests and simple fake clients.

Production Redis clients should also expose atomic set commands:

- `sadd(key, ...members)`
- `srem(key, ...members)`
- `smembers(key)`
- optional `multi().exec()` transaction support

When these commands are available, `RedisStorage` stores registry index and metadata membership in Redis sets. Upserts add members with `SADD`, deletes remove members with `SREM`, reads use `SMEMBERS`, and mutating operations are queued through `multi().exec()` when the client provides it. This avoids lost index updates during concurrent registry writes while preserving backward compatibility for existing JSON-array test clients.

The canonical capability names are lowercase. `RedisStorage` also detects common node-redis aliases (`sAdd`, `sRem`, `sMembers`) and raw uppercase Redis command names (`SADD`, `SREM`, `SMEMBERS`) so callers can pass most Redis clients directly or through a thin adapter.
