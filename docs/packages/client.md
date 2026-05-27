# Client Package

`@oaslananka/a2a-warp-client` re-exports the standalone client surface from the core package.

Primary client operations:

- `A2AClient.connect(agentCardUrl)` resolves an Agent Card and selects the official A2A `1.0` interface by default; experimental profiles require explicit opt-in.
- `client.sendMessage(...)` sends a JSON-RPC `message/send` request.
- `client.sendMessageStream(...)` sends `message/stream` and yields JSON-RPC SSE task updates.
- `client.subscribeTask(taskId)` subscribes to task updates from the configured EventSource task stream.
- `client.getTask(...)`, `client.listTasks(...)`, `client.cancelTask(...)`, `client.setPushNotification(...)`, and `client.getPushNotification(...)` wrap the matching task methods.
