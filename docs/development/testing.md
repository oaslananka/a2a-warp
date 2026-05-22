# Testing

Use the narrowest relevant command first, then run `pnpm run verify` before pushing. Unit tests, integration tests, package dry-runs, docs checks, and security scans are part of the local gate.

Coverage is enforced by `pnpm run test:coverage`. The 1.0.0 launch floor is documented in [ADR-0003](../architecture/adr/0003-coverage-baseline.md) and should only move upward as meaningful server, registry, WebSocket, and adapter branch tests are added.
