# @oaslananka/a2a-warp-testing

Fixtures, matchers, and local server helpers for A2A Warp tests.

See [Compatibility](../../docs/compatibility.md) for supported Node.js, protocol, transport, package, and peer ranges.

The package also exports the reusable conformance fixture runner used by the CLI conformance command:

```ts
import { createConformanceMessageParams, runConformanceSuite } from '@oaslananka/a2a-warp-testing';
```
