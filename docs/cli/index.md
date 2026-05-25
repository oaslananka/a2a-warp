# CLI

The CLI binary is `a2a-warp`. Command pages are generated or checked against command metadata by `scripts/check-docs-commands.mjs`.

## Shared Network Options

Network commands accept the same request options:

```bash
a2a-warp health http://127.0.0.1:3000 --timeout-ms 1000 --json
a2a-warp send http://127.0.0.1:3000 "hello" --bearer-token "$A2A_TOKEN"
a2a-warp discover http://127.0.0.1:3000 --header "x-tenant:demo" --request-id "req-1"
```

PowerShell:

```powershell
a2a-warp health http://127.0.0.1:3000 --timeout-ms 1000 --json
a2a-warp send http://127.0.0.1:3000 "hello" --bearer-token $env:A2A_TOKEN
a2a-warp discover http://127.0.0.1:3000 --header "x-tenant:demo" --request-id "req-1"
```

Supported options are `--header <key:value...>`, `--bearer-token <token>`, `--api-key <name:value>`, `--timeout-ms <ms>`, `--retries <count>`, `--request-id <id>`, and `--origin <url>`.

Secret-bearing values are sent in request headers only; JSON output and validation errors must not echo bearer tokens, API key values, or full auth headers.
