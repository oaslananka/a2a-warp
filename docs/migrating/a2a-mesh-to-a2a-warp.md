# Migrating from a2a-mesh to A2A Warp

The previous private codebase used the `a2a-mesh` identity. The 1.0.0 launch baseline uses `A2A Warp`, repository `oaslananka/a2a-warp`, package `@oaslananka/a2a-warp`, and CLI binary `a2a-warp`.

Replace imports such as:

```ts
import { A2AClient } from 'a2a-mesh';
```

with:

```ts
import { A2AClient } from '@oaslananka/a2a-warp';
```

Replace scaffolding commands from `create-a2a-mesh` to `create-a2a-warp`.
