# a2a-warp discover

Discovers and prints an Agent Card from an A2A endpoint.

```bash
a2a-warp discover http://127.0.0.1:3000
a2a-warp discover http://127.0.0.1:3000 --header "x-tenant:demo" --request-id "req-1"
```

Shared network options such as `--header`, `--bearer-token`, `--api-key`, `--timeout-ms`, `--retries`, `--request-id`, and `--origin` are supported.
