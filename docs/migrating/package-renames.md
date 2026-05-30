# Package Rename Migration (1.x → 1.25+)

This document covers npm package renames applied after the initial 1.25.0 release.
The old names are deprecated and will not receive further updates. Replace them
with the canonical names listed below.

## Transport Package Renames

| Old name                    | New name                              | Install command                                |
| --------------------------- | ------------------------------------- | ---------------------------------------------- |
| `@oaslananka/a2a-warp-ws`   | `@oaslananka/a2a-warp-transport-ws`   | `pnpm add @oaslananka/a2a-warp-transport-ws`   |
| `@oaslananka/a2a-warp-grpc` | `@oaslananka/a2a-warp-transport-grpc` | `pnpm add @oaslananka/a2a-warp-transport-grpc` |

### Import updates (TypeScript)

```diff
- import { WsClient, WsServer } from '@oaslananka/a2a-warp-ws';
+ import { WsClient, WsServer } from '@oaslananka/a2a-warp-transport-ws';

- import { GrpcClient, GrpcServer } from '@oaslananka/a2a-warp-grpc';
+ import { GrpcClient, GrpcServer } from '@oaslananka/a2a-warp-transport-grpc';
```

## Bridge Package Renames

| Old name                          | New name                          | Install command                            |
| --------------------------------- | --------------------------------- | ------------------------------------------ |
| `@oaslananka/a2a-warp-mcp-bridge` | `@oaslananka/a2a-warp-bridge-mcp` | `pnpm add @oaslananka/a2a-warp-bridge-mcp` |

### Import updates (TypeScript)

```diff
- import { ... } from '@oaslananka/a2a-warp-mcp-bridge';
+ import { ... } from '@oaslananka/a2a-warp-bridge-mcp';
```

## Deprecated Standalone Packages

The following packages have been absorbed into `@oaslananka/a2a-warp` as subpath
exports. Install the core package and use the subpath instead.

| Deprecated standalone               | Usage instead                       | Install                         |
| ----------------------------------- | ----------------------------------- | ------------------------------- |
| `@oaslananka/a2a-warp-client`       | `@oaslananka/a2a-warp/client`       | `pnpm add @oaslananka/a2a-warp` |
| `@oaslananka/a2a-warp-testing`      | `@oaslananka/a2a-warp/testing`      | `pnpm add @oaslananka/a2a-warp` |
| `@oaslananka/a2a-warp-codex-bridge` | `@oaslananka/a2a-warp/codex-bridge` | `pnpm add @oaslananka/a2a-warp` |

## Canonical Package Map

The current published package topology is:

| Package                               | Purpose                                                               | Install                                        |
| ------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| `@oaslananka/a2a-warp`                | Core runtime, client, auth, telemetry, storage, testing, codex-bridge | `pnpm add @oaslananka/a2a-warp`                |
| `@oaslananka/a2a-warp-adapters`       | Provider and framework adapters                                       | `pnpm add @oaslananka/a2a-warp-adapters`       |
| `@oaslananka/a2a-warp-registry`       | Registry server and discovery                                         | `pnpm add @oaslananka/a2a-warp-registry`       |
| `@oaslananka/a2a-warp-cli`            | CLI binary `a2a-warp`                                                 | `pnpm add @oaslananka/a2a-warp-cli`            |
| `create-a2a-warp`                     | Project scaffolder                                                    | `pnpm create a2a-warp`                         |
| `@oaslananka/a2a-warp-bridge-mcp`     | MCP bridge                                                            | `pnpm add @oaslananka/a2a-warp-bridge-mcp`     |
| `@oaslananka/a2a-warp-transport-ws`   | WebSocket transport                                                   | `pnpm add @oaslananka/a2a-warp-transport-ws`   |
| `@oaslananka/a2a-warp-transport-grpc` | gRPC transport                                                        | `pnpm add @oaslananka/a2a-warp-transport-grpc` |
| `@oaslananka/a2a-warp-schemas`        | JSON schemas                                                          | `pnpm add @oaslananka/a2a-warp-schemas`        |

Subpath exports under `@oaslananka/a2a-warp`:

- `@oaslananka/a2a-warp/client` — standalone client API
- `@oaslananka/a2a-warp/testing` — test fixtures and matchers
- `@oaslananka/a2a-warp/codex-bridge` — Codex-style tool bridge helpers
- `@oaslananka/a2a-warp/schemas` — Zod schema symbols (runtime parsing)
