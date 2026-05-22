# Registry Package Agent Map

Responsibility: registry server, discovery API, health polling, capability matching, and storage backends.

Allowed imports: public core APIs from `@oaslananka/a2a-warp` and declared dependencies. Do not import adapter internals, CLI code, apps, or docs-site.

Test commands:

```bash
pnpm --filter @oaslananka/a2a-warp-registry run typecheck
pnpm --filter @oaslananka/a2a-warp-registry run test
```

Feature rule: tenant/principal boundaries require tests when auth context participates in registry behavior.
