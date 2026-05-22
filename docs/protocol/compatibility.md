# Protocol Compatibility

Spec reference: Agent2Agent core protocol specification and Agent2Agent specification index reviewed on 2026-05-19.

Implementation target: A2A protocolVersion `1.0` plus compatibility normalization for older Agent Card shapes where tests cover the behavior.

| Feature                             | Status                                       | Evidence                                                          |
| ----------------------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| Agent Cards / discovery metadata    | Implemented                                  | `packages/core/tests/agent-card.test.ts`                          |
| JSON-RPC request/response envelopes | Implemented                                  | `tests/integration/a2a-protocol-compliance.test.ts`               |
| Messages, tasks, artifacts          | Implemented                                  | core and integration tests                                        |
| Task status transitions             | Implemented                                  | `packages/core/tests/TaskManager.test.ts`                         |
| Streaming/SSE                       | Implemented                                  | `packages/core/tests/SSEStreamer.test.ts` and client stream tests |
| Push notifications                  | Implemented where configured                 | `tests/integration/push-notification.test.ts`                     |
| Capability discovery                | Implemented                                  | registry and client tests                                         |
| MCP bridge mapping                  | Implemented for repository-supported mapping | `packages/mcp-bridge/tests/mcp.test.ts`                           |
| gRPC transport                      | Package surface retained                     | Build/package checks plus package tests when added                |
