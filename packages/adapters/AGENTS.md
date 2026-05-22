# Adapters Package Agent Map

Responsibility: optional adapters for supported provider/framework integration surfaces.

Allowed imports: public `@oaslananka/a2a-warp` APIs and optional peer dependencies. Do not import registry server internals, CLI code, apps, or docs-site.

Test commands:

```bash
pnpm --filter @oaslananka/a2a-warp-adapters run typecheck
pnpm --filter @oaslananka/a2a-warp-adapters run test
```

Feature rule: default tests must use fake providers or mocks; live provider calls stay opt-in and credential-gated.
