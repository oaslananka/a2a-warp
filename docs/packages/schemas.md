# @oaslananka/a2a-warp-schemas

Standalone JSON Schema files for the A2A protocol.

## Exports

| Import path                                        | Schema                          |
| -------------------------------------------------- | ------------------------------- |
| `@oaslananka/a2a-warp-schemas/agent-card`          | agent-card.schema.json          |
| `@oaslananka/a2a-warp-schemas/artifact`            | artifact.schema.json            |
| `@oaslananka/a2a-warp-schemas/json-rpc`            | json-rpc.schema.json            |
| `@oaslananka/a2a-warp-schemas/message`             | message.schema.json             |
| `@oaslananka/a2a-warp-schemas/registry-agent`      | registry-agent.schema.json      |
| `@oaslananka/a2a-warp-schemas/registry-export`     | registry-export.schema.json     |
| `@oaslananka/a2a-warp-schemas/registry-task-event` | registry-task-event.schema.json |
| `@oaslananka/a2a-warp-schemas/task`                | task.schema.json                |

All schemas target JSON Schema Draft 2020-12.

## Generation

The JSON Schema files are generated from the Zod schemas in `@oaslananka/a2a-warp/schemas`:

```bash
pnpm run schemas:generate
```

Run `pnpm run schemas:check` in CI to prevent drift.

## Editor Integration

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["agent-card.json"],
      "url": "./node_modules/@oaslananka/a2a-warp-schemas/schemas/agent-card.schema.json"
    }
  ]
}
```

### JetBrains

Use **Settings → Languages & Frameworks → Schemas and DTDs → JSON Schema Mappings**.

## CLI Validation

```bash
npm install -g ajv-cli
ajv validate -s node_modules/@oaslananka/a2a-warp-schemas/schemas/agent-card.schema.json -d path/to/agent-card.json
```

## Related

- [Protocol schemas doc](../protocol/schemas.md)
- [Compatibility matrix](../compatibility.md)
