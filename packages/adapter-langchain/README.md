# @oaslananka/a2a-warp-adapter-langchain

LangChain / LangGraph adapter for the Agent2Agent protocol.

`LangChainAdapter` wraps runnable-style LangChain or LangGraph pipelines and serializes the latest response into A2A artifacts.

## Install

```bash
pnpm add @oaslananka/a2a-warp-adapter-langchain langchain
```

## Usage

```ts
import { LangChainAdapter, type LangChainRunnable } from '@oaslananka/a2a-warp-adapter-langchain';
import type { AnyAgentCard } from '@oaslananka/a2a-warp';

const runnable: LangChainRunnable = {
  invoke: async (input) => {
    /* ... */
  },
};
const adapter = new LangChainAdapter(card, runnable);
```

See [Compatibility](../../docs/compatibility.md) for supported ranges.
