# @oaslananka/a2a-warp-adapter-anthropic

Anthropic Claude Messages API adapter for the Agent2Agent protocol.

`AnthropicAdapter` targets Claude Messages-compatible runtimes and supports both standard and streamed task execution flows.

## Install

```bash
pnpm add @oaslananka/a2a-warp-adapter-anthropic @anthropic-ai/sdk
```

## Usage

```ts
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicAdapter } from '@oaslananka/a2a-warp-adapter-anthropic';
import type { AnyAgentCard } from '@oaslananka/a2a-warp';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const card: AnyAgentCard = {
  /* ... */
};
const adapter = new AnthropicAdapter(card, client, 'claude-opus-4-6');
```

See [Compatibility](../../docs/compatibility.md) for supported ranges.
