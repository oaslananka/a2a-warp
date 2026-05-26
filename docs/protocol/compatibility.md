# Protocol Compatibility

Spec reference: Agent2Agent core protocol specification and Agent2Agent specification index reviewed on 2026-05-19; conformance fixture inputs were refreshed against the Agent2Agent latest specification on 2026-05-24.

Implementation target: A2A protocolVersion `1.0` plus compatibility normalization for older Agent Card shapes where tests cover the behavior.

For the broader Node.js, package, transport, optional peer, and deprecation policy matrix, see [Compatibility](../compatibility.md).

| Feature                             | Status                                       | Evidence                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent Cards / discovery metadata    | Implemented                                  | `packages/core/tests/agent-card.test.ts`; `tests/conformance/fixtures/a2a-1.0/agent-card.json`; `tests/conformance/fixtures/a2a-1.2/agent-card.json`                      |
| JSON-RPC request/response envelopes | Implemented                                  | `tests/integration/a2a-protocol-compliance.test.ts`; `tests/conformance/fixtures/a2a-1.0/message-request.json`; `tests/conformance/fixtures/a2a-1.2/message-request.json` |
| JSON-RPC batch requests             | Explicitly rejected with `InvalidRequest`    | `packages/core/tests/A2AServerEdge.test.ts`; `tests/conformance/fixtures/a2a-1.0/negative-cases.json`; `tests/conformance/fixtures/a2a-1.2/negative-cases.json`           |
| Messages, tasks, artifacts          | Implemented                                  | core and integration tests; `tests/conformance/fixtures/a2a-1.0/task-response.json`; `tests/conformance/fixtures/a2a-1.2/task-response.json`                              |
| Task status transitions             | Implemented                                  | `packages/core/tests/TaskManager.test.ts`; `tests/conformance/a2a-conformance.test.ts`                                                                                    |
| Streaming/SSE                       | Implemented                                  | `packages/core/tests/SSEStreamer.test.ts`; `tests/conformance/fixtures/a2a-1.0/stream-events.json`; `tests/conformance/fixtures/a2a-1.2/stream-events.json`               |
| Push notifications                  | Implemented where configured                 | `tests/integration/push-notification.test.ts`; `tests/conformance/fixtures/a2a-1.0/push-config.json`; `tests/conformance/fixtures/a2a-1.2/push-config.json`               |
| Capability discovery                | Implemented                                  | registry and client tests; `tests/conformance/fixtures/a2a-1.0/agent-card.json`; `tests/conformance/fixtures/a2a-1.2/agent-card.json`                                     |
| MCP bridge mapping                  | Implemented for repository-supported mapping | `packages/mcp-bridge/tests/mcp.test.ts`                                                                                                                                   |
| gRPC transport                      | Package surface retained                     | Build/package checks plus package tests when added                                                                                                                        |

## Executable Conformance Fixtures

Run the versioned fixtures with:

```bash
pnpm run test:conformance
```

Fixture coverage:

| Fixture path                                              | Covered behavior                                                |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `tests/conformance/fixtures/a2a-1.0/agent-card.json`      | A2A `1.0` discovery metadata and capabilities                   |
| `tests/conformance/fixtures/a2a-1.0/message-request.json` | A2A `1.0` `message/send` JSON-RPC request                       |
| `tests/conformance/fixtures/a2a-1.0/task-response.json`   | A2A `1.0` task, message history, and artifact result            |
| `tests/conformance/fixtures/a2a-1.0/stream-events.json`   | A2A `1.0` `message/stream` JSON-RPC SSE flow                    |
| `tests/conformance/fixtures/a2a-1.0/push-config.json`     | A2A `1.0` push notification configuration                       |
| `tests/conformance/fixtures/a2a-1.0/negative-cases.json`  | A2A `1.0` negative JSON-RPC cases                               |
| `tests/conformance/fixtures/a2a-1.2/agent-card.json`      | A2A `1.2` discovery metadata, interfaces, and capabilities      |
| `tests/conformance/fixtures/a2a-1.2/message-request.json` | A2A `1.2` `message/send` JSON-RPC request                       |
| `tests/conformance/fixtures/a2a-1.2/task-response.json`   | A2A `1.2` task, message history, data part, and artifact result |
| `tests/conformance/fixtures/a2a-1.2/stream-events.json`   | A2A `1.2` `message/stream` JSON-RPC SSE flow                    |
| `tests/conformance/fixtures/a2a-1.2/push-config.json`     | A2A `1.2` push notification configuration                       |
| `tests/conformance/fixtures/a2a-1.2/negative-cases.json`  | A2A `1.2` negative JSON-RPC cases                               |
