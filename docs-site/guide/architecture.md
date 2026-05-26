# Architecture

The canonical architecture document lives in
[docs/development/architecture.md](https://github.com/oaslananka/a2a-warp/blob/main/docs/development/architecture.md).

It covers package dependency direction, runtime request flow, JSON-RPC dispatch, task
lifecycle, storage, registry polling, outbound URL policy, auth, telemetry, release flow,
and the tests and ADRs that protect those decisions.

## Package Direction

```text
types/schemas -> core runtime -> transports -> client/registry -> adapters/bridges -> CLI/apps
```

`packages/core` owns protocol types, schemas, runtime, client primitives, auth, storage,
telemetry, and outbound network policy. Transports, registry, adapters, bridges, CLI, apps,
docs-site, and examples consume public package APIs above that layer.

## Workspace graph

Run the graph check when package boundaries change:

```bash
node scripts/check-workspace-graph.mjs --summary
```

Expected summary:

```text
Workspace graph validation passed.
Checked 10 public package import aliases across 32 forbidden dependency edges.
Dependency direction: types/schemas -> core runtime -> transports -> client/registry -> adapters/bridges -> CLI/apps.
```

## Verification Links

- [ADR index](https://github.com/oaslananka/a2a-warp/blob/main/docs/architecture/adr/index.md)
- [Client/server integration tests](https://github.com/oaslananka/a2a-warp/blob/main/tests/integration/client-server.test.ts)
- [Transport contract helper](https://github.com/oaslananka/a2a-warp/blob/main/tests/transport-contract/transportContract.ts)
- [Task lifecycle property tests](https://github.com/oaslananka/a2a-warp/blob/main/packages/core/tests/properties/task-lifecycle.property.test.ts)
- [Telemetry snapshot tests](https://github.com/oaslananka/a2a-warp/blob/main/packages/core/tests/telemetry-snapshots.test.ts)
- [Release artifact tests](https://github.com/oaslananka/a2a-warp/blob/main/tests/integration/release-artifacts.test.ts)
