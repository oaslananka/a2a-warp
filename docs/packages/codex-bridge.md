# Codex Bridge Package

`@oaslananka/a2a-warp/codex-bridge` contains mapping helpers for exposing A2A agents through Codex-style tool surfaces.

Import from `@oaslananka/a2a-warp/codex-bridge`:

```typescript
import { createA2ASendMessageTool } from '@oaslananka/a2a-warp/codex-bridge';
```

Exported utilities:

- `createA2ASendMessageTool(options)` creates a `CodexToolDefinition` that sends messages to an A2A agent.
- `createRegistryListTool(options)` creates a `CodexToolDefinition` that queries an A2A registry for agents.
