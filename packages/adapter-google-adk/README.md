# @oaslananka/a2a-warp-adapter-google-adk

Google Agent Development Kit (ADK) HTTP adapter for the Agent2Agent protocol.

`GoogleADKAdapter` wraps deployed Google ADK agents as A2A servers, handling task history and streaming responses.

## Install

```bash
pnpm add @oaslananka/a2a-warp-adapter-google-adk
```

## Usage

```ts
import { GoogleADKAdapter } from '@oaslananka/a2a-warp-adapter-google-adk';
import type { AnyAgentCard } from '@oaslananka/a2a-warp';

const adapter = new GoogleADKAdapter(
  card,
  'https://my-adk-agent.example.com',
  process.env.GOOGLE_API_KEY,
);
```

See [Compatibility](../../docs/compatibility.md) for supported ranges.
