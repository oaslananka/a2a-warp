# a2a-warp send

Sends a text message to an A2A endpoint.

```bash
a2a-warp send http://127.0.0.1:3000 "hello"
a2a-warp send http://127.0.0.1:3000 "hello" --bearer-token "$A2A_TOKEN"
```

Shared network options such as `--header`, `--bearer-token`, `--api-key`, `--timeout-ms`, `--retries`, `--request-id`, and `--origin` are supported.
