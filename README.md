# A2A Warp

A2A Warp is an independent TypeScript runtime and toolkit for the Agent2Agent (A2A) protocol. It is not an official Google, Linux Foundation, or a2aproject package.

## What It Provides

- A2A server runtime and client SDK for Agent Cards, JSON-RPC messages, tasks, artifacts, and status transitions.
- Registry components for local discovery and health polling.
- Adapters for OpenAI, Anthropic, LangChain, Google ADK, LlamaIndex, and CrewAI HTTP bridge flows when the optional peer dependency is installed.
- CLI commands for validation, discovery, sending messages, monitoring tasks, benchmarking, diagnostics, and scaffolding.
- MCP bridge, WebSocket transport, gRPC transport, and testing helper packages for repository-verified workflows.

## Install

```bash
pnpm add @oaslananka/a2a-warp
```

PowerShell:

```powershell
pnpm add @oaslananka/a2a-warp
```

## Quickstart

```bash
pnpm create a2a-warp demo
cd demo
pnpm install
pnpm run dev
```

PowerShell:

```powershell
pnpm create a2a-warp demo
Set-Location demo
pnpm install
pnpm run dev
```

## CLI Examples

```bash
a2a-warp validate ./agent-card.json
a2a-warp discover http://127.0.0.1:3000
a2a-warp send http://127.0.0.1:3000 "hello"
a2a-warp health http://127.0.0.1:3000 --timeout-ms 1000 --json
a2a-warp conformance http://127.0.0.1:3000 --protocol-version 1.2 --json
a2a-warp monitor http://127.0.0.1:3000 --cycles 3
a2a-warp benchmark http://127.0.0.1:3000 --requests 25 --concurrency 5
a2a-warp doctor --json
```

## Package List

| Package                             | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `@oaslananka/a2a-warp`              | Core runtime, client APIs, auth, telemetry, storage, and middleware.     |
| `@oaslananka/a2a-warp-client`       | Standalone client re-exports for users who want a smaller import target. |
| `@oaslananka/a2a-warp-adapters`     | Optional framework/provider adapters.                                    |
| `@oaslananka/a2a-warp-registry`     | Registry server, discovery client, health polling, and storage helpers.  |
| `@oaslananka/a2a-warp-cli`          | CLI binary `a2a-warp`.                                                   |
| `create-a2a-warp`                   | Project scaffolder.                                                      |
| `@oaslananka/a2a-warp-mcp-bridge`   | A2A and MCP mapping helpers.                                             |
| `@oaslananka/a2a-warp-ws`           | WebSocket transport helpers.                                             |
| `@oaslananka/a2a-warp-grpc`         | gRPC transport helpers.                                                  |
| `@oaslananka/a2a-warp-testing`      | Test fixtures, matchers, and local server helpers.                       |
| `@oaslananka/a2a-warp-codex-bridge` | Codex-style tool bridge helpers.                                         |

## A2A Protocol Compatibility

The implementation targets Agent Cards, JSON-RPC request/response envelopes, messages, tasks, artifacts, task status transitions, streaming/SSE, push notification registration, and capability discovery as described in the Agent2Agent core specification reviewed on 2026-05-19. See [docs/protocol/compatibility.md](docs/protocol/compatibility.md).

## Security Defaults

- Public HTTP server mode must use authentication unless it is bound to loopback.
- A2A server and registry HTTP routes apply a per-client request limit by default.
- Remote fetches and callback URLs pass SSRF policy helpers.
- CORS and WebSocket origin checks fail closed when configured.
- CLI and bridge code avoid printing full auth headers or concrete secret values.
- Release publishing is owner-triggered only and uses npm Trusted Publishing/OIDC.

## Supported Adapters And Transports

| Surface             | Status                  | Verification                                       |
| ------------------- | ----------------------- | -------------------------------------------------- |
| OpenAI adapter      | Supported               | Unit tests with fake provider objects.             |
| Anthropic adapter   | Supported               | Unit tests with fake provider objects.             |
| LangChain adapter   | Supported               | Unit tests with fake runnables.                    |
| Google ADK adapter  | Supported               | Unit and streaming tests.                          |
| LlamaIndex adapter  | Supported               | Unit tests with fake provider objects.             |
| CrewAI HTTP bridge  | Supported               | Unit tests with local fetch mocks.                 |
| SSE streaming       | Supported               | Unit and integration tests.                        |
| WebSocket transport | Supported               | Package tests.                                     |
| gRPC transport      | Kept as package surface | Build and package checks; see compatibility notes. |
| MCP bridge          | Supported               | Mapping tests.                                     |

## Naming And Affiliation

`A2A Warp` is this project's name; A2A is used descriptively for the Agent2Agent protocol; this project is not affiliated with protocol stewards or third-party developer tools using the word Warp.

## Documentation

- [Install](docs/install.md)
- [Quickstart](docs/quickstart.md)
- [Protocol compatibility](docs/protocol/compatibility.md)
- [Threat model](docs/security/threat-model.md)
- [Release process](docs/release/process.md)
- [Branch protection](docs/release/branch-protection.md)

Docs site: [https://oaslananka.github.io/a2a-warp/](https://oaslananka.github.io/a2a-warp/)

## License

Apache-2.0. See [LICENSE](LICENSE).
