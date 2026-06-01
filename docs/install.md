# Install

## Requirements

- Node.js `>=22.22.1 <25`
- pnpm `>=11 <12`

## Install the core runtime

pnpm (recommended):

```bash
pnpm add @oaslananka/a2a-warp
```

npm:

```bash
npm install @oaslananka/a2a-warp
```

yarn:

```bash
yarn add @oaslananka/a2a-warp
```

PowerShell:

```powershell
pnpm add @oaslananka/a2a-warp
```

## Install the CLI globally

```bash
pnpm add --global @oaslananka/a2a-warp-cli
```

After install, run `a2a-warp --help` to list commands.

## Other packages

Optional packages can be added when a project needs that surface. All packages are at `@oaslananka/a2a-warp-*`:

| Package                                   | Description                               |
| ----------------------------------------- | ----------------------------------------- |
| `@oaslananka/a2a-warp-core`               | Protocol types and validators (zero deps) |
| `@oaslananka/a2a-warp` (`/client`)        | Standalone client subpath export          |
| `@oaslananka/a2a-warp-cli`                | CLI binary (`a2a-warp`)                   |
| `@oaslananka/a2a-warp-registry`           | Registry server                           |
| `@oaslananka/a2a-warp-adapter-openai`     | OpenAI Chat adapter                       |
| `@oaslananka/a2a-warp-adapter-anthropic`  | Anthropic Claude adapter                  |
| `@oaslananka/a2a-warp-adapter-langchain`  | LangChain / LangGraph adapter             |
| `@oaslananka/a2a-warp-adapter-google-adk` | Google ADK adapter                        |
| `@oaslananka/a2a-warp-adapter-llamaindex` | LlamaIndex adapter                        |
| `@oaslananka/a2a-warp-adapter-crewai`     | CrewAI adapter                            |
| `@oaslananka/a2a-warp-bridge-mcp`         | MCP bridge helpers                        |
| `@oaslananka/a2a-warp-transport-ws`       | WebSocket transport                       |
| `@oaslananka/a2a-warp-transport-grpc`     | gRPC transport                            |
| `@oaslananka/a2a-warp-auth`               | Auth middleware                           |
| `@oaslananka/a2a-warp-telemetry`          | OpenTelemetry integration                 |
| `create-a2a-warp`                         | Project scaffolder                        |

See [Compatibility](compatibility.md) for the full version matrix.
