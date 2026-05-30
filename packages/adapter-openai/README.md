# @oaslananka/a2a-warp-adapter-openai

OpenAI Chat API adapter for the Agent2Agent protocol.

`OpenAIAdapter` converts A2A task history into OpenAI chat-completion requests and returns the generated reply as an A2A artifact.

## Install

```bash
pnpm add @oaslananka/a2a-warp-adapter-openai openai
```

## Usage

```ts
import OpenAI from 'openai';
import { OpenAIAdapter } from '@oaslananka/a2a-warp-adapter-openai';
import type { AnyAgentCard } from '@oaslananka/a2a-warp';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const card: AnyAgentCard = {
  /* ... */
};
const adapter = new OpenAIAdapter(card, client, 'gpt-4o');
```

See [Compatibility](../../docs/compatibility.md) for supported ranges.
