# Compatibility

This page is the canonical compatibility matrix for A2A Warp runtime versions,
package surfaces, protocol fixtures, transports, optional peers, and deprecation
windows.

Last checked on 2026-05-26 against the
[Node.js release schedule](https://github.com/nodejs/Release/blob/main/schedule.json),
the [Node.js release index](https://nodejs.org/download/release/index.json), and
the repository
[`tools/runtime-versions.json`](https://github.com/oaslananka/a2a-warp/blob/main/tools/runtime-versions.json)
manifest.

## Runtime Compatibility

The workspace engine range is Node.js `>=22.22.1 <25` and pnpm `>=11 <12`.
In plain engine terms, use Node.js `>=22.22.1 <25` and pnpm >=11 <12.
Development tooling pins pnpm `11.5.0` through `packageManager` and
`tools/runtime-versions.json`.

| Runtime            | Repository status         | Current repository version                | Upstream status on 2026-05-26                                 | Support policy                                                                 |
| ------------------ | ------------------------- | ----------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Node.js 22 Jod     | Supported LTS floor       | `22.22.3` in CI smoke                     | Maintenance LTS, EOL `2027-04-30`                             | Supported until the repository announces a higher floor through this page.     |
| Node.js 24 Krypton | Preferred LTS line        | `24.16.0` in `.node-version` and `.nvmrc` | Active LTS, maintenance starts `2026-10-20`, EOL `2028-04-30` | Preferred local, CI, docs, and scaffold runtime.                               |
| Node 25            | Not supported             | Not used                                  | Current/maintenance line ending `2026-06-01`                  | Odd-numbered Current lines are not supported until the engine range is raised. |
| pnpm 11            | Supported package manager | `11.5.0`                                  | Latest registry metadata checked separately                   | Required for workspace scripts and lockfile consistency.                       |

Do not rely on Node.js 20 or older. Node.js 20 is outside the repository engine
range and is already EOL in the Node.js project schedule checked for this policy.

## Package Version Matrix

All public packages in the 5.1.x, 6.0.x, 6.1.x, 7.0.x, 7.1.x, and 8.0.x lines share the same Node engine
range: `>=22.22.1 <25`.

| Package                                   | Current version | Node range      | Compatibility notes                                                                                              |
| ----------------------------------------- | --------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@oaslananka/a2a-warp`                    | `8.1.1`         | `>=22.22.1 <25` | Core runtime, client APIs, storage, testing helpers, and Codex-style tools — re-exports auth and telemetry APIs. |
| `@oaslananka/a2a-warp-adapter-anthropic`  | `8.1.1`         | `>=22.22.1 <25` | Anthropic Claude Messages API adapter.                                                                           |
| `@oaslananka/a2a-warp-adapter-base`       | `8.1.1`         | `>=22.22.1 <25` | Abstract base adapter and contract helpers.                                                                      |
| `@oaslananka/a2a-warp-adapter-crewai`     | `8.1.1`         | `>=22.22.1 <25` | CrewAI HTTP bridge adapter.                                                                                      |
| `@oaslananka/a2a-warp-adapter-google-adk` | `8.1.1`         | `>=22.22.1 <25` | Google Agent Development Kit HTTP adapter.                                                                       |
| `@oaslananka/a2a-warp-adapter-langchain`  | `8.1.1`         | `>=22.22.1 <25` | LangChain / LangGraph runnable adapter.                                                                          |
| `@oaslananka/a2a-warp-adapter-llamaindex` | `8.1.1`         | `>=22.22.1 <25` | LlamaIndex query/chat engine adapter.                                                                            |
| `@oaslananka/a2a-warp-adapter-openai`     | `8.1.1`         | `>=22.22.1 <25` | OpenAI Chat API adapter.                                                                                         |
| `@oaslananka/a2a-warp-adapters`           | `8.1.1`         | `>=22.22.1 <25` | **Deprecated** — use individual `@oaslananka/a2a-warp-adapter-*` packages instead.                               |
| `@oaslananka/a2a-warp-core`               | `8.1.1`         | `>=22.22.1 <25` | Protocol types, interfaces, constants, and validators. Zero runtime dependencies.                                |
| `@oaslananka/a2a-warp-auth`               | `1.0.0`         | `>=22.22.1 <25` | Authentication and authorization middleware, helpers, and JWT/JWKS utilities.                                    |
| `@oaslananka/a2a-warp-telemetry`          | `1.0.0`         | `>=22.22.1 <25` | OpenTelemetry integration, trace context propagation, and W3C TraceContext helpers.                              |
| `@oaslananka/a2a-warp-registry`           | `8.1.1`         | `>=22.22.1 <25` | Registry server, discovery, health, and storage helpers.                                                         |
| `@oaslananka/a2a-warp-cli`                | `8.1.1`         | `>=22.22.1 <25` | Published `a2a-warp` command-line interface.                                                                     |
| `create-a2a-warp`                         | `8.1.1`         | `>=22.22.1 <25` | Project scaffolder.                                                                                              |
| `@oaslananka/a2a-warp-bridge-mcp`         | `8.1.1`         | `>=22.22.1 <25` | A2A and MCP mapping helpers.                                                                                     |
| `@oaslananka/a2a-warp-transport-ws`       | `8.1.1`         | `>=22.22.1 <25` | WebSocket transport helpers.                                                                                     |
| `@oaslananka/a2a-warp-transport-grpc`     | `8.1.1`         | `>=22.22.1 <25` | gRPC transport helpers.                                                                                          |
| `@oaslananka/a2a-warp-schemas`            | `8.1.1`         | `>=22.22.1 <25` | Standalone JSON Schema files for editor and CI validation.                                                       |
| `@oaslananka/a2a-warp`                    | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-anthropic`  | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-base`       | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-crewai`     | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-google-adk` | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-langchain`  | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-llamaindex` | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-openai`     | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapters`           | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-core`               | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-auth`               | `1.0.0`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-telemetry`          | `1.0.0`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-registry`           | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-cli`                | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `create-a2a-warp`                         | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-bridge-mcp`         | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-transport-ws`       | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-transport-grpc`     | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-schemas`            | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp`                    | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-anthropic`  | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-base`       | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-crewai`     | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-google-adk` | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-langchain`  | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-llamaindex` | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapter-openai`     | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-adapters`           | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-core`               | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-auth`               | `1.0.0`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-telemetry`          | `1.0.0`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-registry`           | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-cli`                | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `create-a2a-warp`                         | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-bridge-mcp`         | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-transport-ws`       | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-transport-grpc`     | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |
| `@oaslananka/a2a-warp-schemas`            | `8.1.1`         | `>=22.22.1 <25` | Previous line — still compatible.                                                                                |

Patch releases may add compatible bug fixes, tests, and docs. New public package
surfaces must update `public-surface.json`, package docs, and this matrix before
release.

## Protocol Version Matrix

| Protocol version | Status in A2A Warp                              | Evidence and behavior                                                                                                                                                                                           |
| ---------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0.3`            | Legacy input compatibility only                 | Agent Cards and registry interface metadata may be normalized when tests cover the shape. New runtime responses do not target `0.3`.                                                                            |
| `1.0`            | Primary runtime target                          | Core server/client tests, integration tests, Agent Card compatibility, and default CLI conformance use A2A `1.0` as the canonical runtime surface.                                                              |
| `1.2`            | a2a-warp experimental profile fixtures (opt-in) | Versioned fixtures and schemas cover the experimental Agent Card, message, task, stream, push, and negative cases. Client negotiation and CLI conformance do not prefer this profile unless the caller opts in. |
| Future versions  | Unsupported until added deliberately            | A new version requires schemas, fixtures, CLI conformance support, docs, and protocol compatibility tests before it is documented as supported.                                                                 |

The executable fixture set lives under `tests/conformance/fixtures/` and is run
with `pnpm run test:conformance`.

## Transport Feature Matrix

| Transport surface | Status                       | Covered behavior                                                                                                                              | Required verification                                               |
| ----------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| HTTP+JSON         | Supported                    | Agent Card discovery, JSON-RPC `message/send`, task reads, task cancellation, push notification routes, registry routes, health, and metrics. | Core, registry, integration, and conformance tests.                 |
| SSE               | Supported                    | `message/stream`, task event streaming, heartbeat/close behavior, and task resubscribe surfaces.                                              | Core SSE tests, integration tests, and conformance stream fixtures. |
| WebSocket         | Supported package surface    | Request/response A2A JSON-RPC over `@oaslananka/a2a-warp-transport-ws`.                                                                       | WebSocket package tests and shared transport contract tests.        |
| gRPC              | Retained package surface     | A2A task and agent-card flows through `@oaslananka/a2a-warp-transport-grpc`.                                                                  | gRPC package tests and shared transport contract tests.             |
| MCP bridge        | Bridge, not an A2A transport | Maps supported MCP tool shapes to A2A tool/task concepts.                                                                                     | MCP bridge mapping tests.                                           |

No transport should be documented for broad deployment without matching tests and
security documentation for its auth, origin, TLS, or callback behavior.

## Adapter Optional Peer Ranges

Provider and framework SDKs stay peer dependencies where possible so default
installs do not pull every integration stack.

| Package                                   | Peer dependency                             | Supported range                                                |
| ----------------------------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| `@oaslananka/a2a-warp`                    | `@opentelemetry/api`                        | `^1.9.1`                                                       |
| `@oaslananka/a2a-warp-telemetry`          | `@opentelemetry/api`                        | `^1.9.1`                                                       |
| `@oaslananka/a2a-warp-telemetry`          | `@opentelemetry/exporter-metrics-otlp-http` | `^0.218.0`                                                     |
| `@oaslananka/a2a-warp-telemetry`          | `@opentelemetry/exporter-trace-otlp-http`   | `^0.218.0`                                                     |
| `@oaslananka/a2a-warp-telemetry`          | `@opentelemetry/resources`                  | `^2.7.1`                                                       |
| `@oaslananka/a2a-warp-telemetry`          | `@opentelemetry/sdk-metrics`                | `^2.7.1`                                                       |
| `@oaslananka/a2a-warp-telemetry`          | `@opentelemetry/sdk-node`                   | `^0.218.0`                                                     |
| `@oaslananka/a2a-warp-adapter-anthropic`  | `@anthropic-ai/sdk`                         | `^0.39.0 \|\| ^0.95.0 \|\| ^0.96.0 \|\| ^0.99.0 \|\| ^0.100.0` |
| `@oaslananka/a2a-warp-adapter-langchain`  | `langchain`                                 | `^0.3.37 \|\| ^1.0.0`                                          |
| `@oaslananka/a2a-warp-adapter-llamaindex` | `llamaindex`                                | `^0.9.11 \|\| ^0.12.0`                                         |
| `@oaslananka/a2a-warp-adapter-openai`     | `openai`                                    | `^4.20.0 \|\| ^6.0.0`                                          |
| `@oaslananka/a2a-warp-adapters`           | `@anthropic-ai/sdk`                         | `^0.39.0 \|\| ^0.95.0 \|\| ^0.96.0 \|\| ^0.99.0 \|\| ^0.100.0` |
| `@oaslananka/a2a-warp-adapters`           | `langchain`                                 | `^0.3.37 \|\| ^1.0.0`                                          |
| `@oaslananka/a2a-warp-adapters`           | `llamaindex`                                | `^0.9.11 \|\| ^0.12.0`                                         |
| `@oaslananka/a2a-warp-adapters`           | `openai`                                    | `^4.20.0 \|\| ^6.0.0`                                          |
| `@oaslananka/a2a-warp-transport-ws`       | `ws`                                        | `^8.18.0`                                                      |

Adapter tests use fake provider objects by default. Live provider behavior must
remain opt-in and cannot be required by the default local verification gate.

## Deprecation Policy

A supported runtime, protocol fixture, transport, package entry point, CLI command,
or peer dependency range needs a minimum 90 days notice and one minor release with
documentation before removal. The notice must name the replacement path, migration
steps, affected package versions, and the first release where removal can happen.

Breaking removals should happen in a major release unless the upstream runtime or
provider has already reached EOL or has an active security issue that makes support
unsafe.

### Removal conditions

Removal can proceed only when all of the following are true:

- The deprecation notice has shipped in release notes, this page, and affected
  package docs.
- A compatible replacement or explicit unsupported status is documented.
- Tests, schemas, examples, and command docs no longer depend on the deprecated
  surface.
- Protected branch CI passes on the removal change.
- Security or ecosystem risk from keeping the surface is documented when removal
  happens before the normal notice window.

## Validation Commands

```bash
pnpm run docs:check
pnpm run docs:build
pnpm run lint:md
```

PowerShell:

```powershell
pnpm run docs:check
pnpm run docs:build
pnpm run lint:md
```
