# @oaslananka/a2a-warp-adapter-crewai

CrewAI HTTP bridge adapter for the Agent2Agent protocol.

`CrewAIAdapter` bridges CrewAI-oriented orchestration to the A2A task contract for transport, discovery, and monitoring.

## Install

```bash
pnpm add @oaslananka/a2a-warp-adapter-crewai
```

## Usage

```ts
import { CrewAIAdapter } from '@oaslananka/a2a-warp-adapter-crewai';
import type { AnyAgentCard } from '@oaslananka/a2a-warp';

const adapter = new CrewAIAdapter(card, 'http://localhost:8080/crewai-bridge');
```

See [Compatibility](../../docs/compatibility.md) for supported ranges.
