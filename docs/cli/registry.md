# a2a-warp registry

Starts a local registry, lists registered agents, and moves registry state between control planes with versioned JSON export files.

```bash
a2a-warp registry start --port 3099
a2a-warp registry list --url http://127.0.0.1:3099 --json
a2a-warp registry export --url http://127.0.0.1:3099 --output ./registry-export.json --bearer-token "$REGISTRY_TOKEN"
a2a-warp registry import --url http://127.0.0.1:3099 --input ./registry-export.json --bearer-token "$REGISTRY_TOKEN"
```

PowerShell:

```powershell
a2a-warp registry start --port 3099
a2a-warp registry list --url http://127.0.0.1:3099 --json
a2a-warp registry export --url http://127.0.0.1:3099 --output .\registry-export.json --bearer-token $env:REGISTRY_TOKEN
a2a-warp registry import --url http://127.0.0.1:3099 --input .\registry-export.json --bearer-token $env:REGISTRY_TOKEN
```

## Export Format

`registry export` writes a JSON document with:

- `$schema`: `https://oaslananka.github.io/a2a-warp/schemas/registry-export.schema.json`
- `schemaVersion`: currently `1`
- `exportedAt`: ISO timestamp
- `agents`: registered agent records
- `metadata`: source, agent count, tenant ids, and public agent count

The checked-in JSON Schema is `docs/protocol/schemas/registry-export.schema.json`; the docs site serves the same schema under `/schemas/registry-export.schema.json`.

## Authentication

Registries configured with `registrationToken`, `requireAuth`, or JWT auth require control-plane credentials for export and import. Use the shared network options such as `--bearer-token`, `--header`, `--api-key`, `--timeout-ms`, `--retries`, `--request-id`, and `--origin`.

Tenant-scoped credentials export records visible to that tenant, including public agents. Imports are idempotent when an incoming record matches an existing agent by `id` or `url`.
