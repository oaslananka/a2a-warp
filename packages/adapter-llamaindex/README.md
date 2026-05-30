# @oaslananka/a2a-warp-adapter-llamaindex

LlamaIndex adapter for the Agent2Agent protocol.

`LlamaIndexAdapter` connects LlamaIndex chat-engine and query-engine style execution with A2A tasks, history, and artifact generation.

## Install

```bash
pnpm add @oaslananka/a2a-warp-adapter-llamaindex llamaindex
```

## Usage

```ts
import { LlamaIndexAdapter } from '@oaslananka/a2a-warp-adapter-llamaindex';
import type { AnyAgentCard } from '@oaslananka/a2a-warp';

const engine = {
  query: async (input) => {
    /* ... */
  },
};
const adapter = new LlamaIndexAdapter(card, engine);
```

See [Compatibility](../../docs/compatibility.md) for supported ranges.
