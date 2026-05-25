# a2a-warp validate

Validates an Agent Card from a local file or HTTP endpoint.

```bash
a2a-warp validate ./agent-card.json
a2a-warp validate http://127.0.0.1:3000 --timeout-ms 1000
```

```powershell
a2a-warp validate .\agent-card.json
a2a-warp validate http://127.0.0.1:3000 --timeout-ms 1000
```

Shared network options are applied when the target is an HTTP endpoint.
