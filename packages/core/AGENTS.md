# Core Package Agent Map

Responsibility: protocol types, runtime server/client, auth, storage, middleware, telemetry, URL policy, and public core exports.

Allowed imports: standard library, runtime dependencies declared in `packages/core/package.json`, and internal core modules. Do not import adapters, registry, CLI, apps, docs-site, bridge packages, or testing helpers from runtime source.

Test commands:

```bash
pnpm --filter @oaslananka/a2a-warp run typecheck
pnpm --filter @oaslananka/a2a-warp run test
```

Feature rule: add behavior tests under `packages/core/tests/`, keep telemetry side-effect-free until bootstrapped, and update `public-surface.json` only for intentional exports.
