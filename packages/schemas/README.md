# @oaslananka/a2a-warp-schemas

Standalone JSON Schema files for the [Agent2Agent (A2A) protocol](https://github.com/oaslananka/a2a-warp).

Use this package in your editor, CI, or validation pipeline without installing the runtime.

See [Compatibility](../../docs/compatibility.md) for supported Node.js, protocol, transport, package, and peer ranges.

## Usage

### Import in Node.js (ESM)

```js
import agentCard from '@oaslananka/a2a-warp-schemas/agent-card' with { type: 'json' };
import message from '@oaslananka/a2a-warp-schemas/message' with { type: 'json' };
import task from '@oaslananka/a2a-warp-schemas/task' with { type: 'json' };
```

### Import in TypeScript

```ts
import agentCard from '@oaslananka/a2a-warp-schemas/agent-card.json' with { type: 'json' };
```

### VS Code settings.json

```json
{
  "json.schemas": [
    {
      "fileMatch": ["agent-card.json"],
      "url": "https://oaslananka.github.io/a2a-warp/schemas/agent-card.schema.json"
    },
    {
      "fileMatch": ["message.json"],
      "url": "https://oaslananka.github.io/a2a-warp/schemas/message.schema.json"
    },
    {
      "fileMatch": ["task.json"],
      "url": "https://oaslananka.github.io/a2a-warp/schemas/task.schema.json"
    }
  ]
}
```

### JetBrains (IntelliJ, WebStorm)

Add to `.idea/jsonSchemas.xml` or use **Settings → Languages & Frameworks → Schemas and DTDs → JSON Schema Mappings**.

### GitHub Actions — schema validation

```yaml
- uses: ClassificationAPI/go-json-schema-validation@v1
  with:
    schema: node_modules/@oaslananka/a2a-warp-schemas/schemas/agent-card.schema.json
    document: path/to/agent-card.json
```

### CI validation with ajv

```bash
npm install -g ajv-cli
ajv validate -s node_modules/@oaslananka/a2a-warp-schemas/schemas/agent-card.schema.json -d path/to/agent-card.json
```

## Exports

| Subpath                 | Schema file                               |
| ----------------------- | ----------------------------------------- |
| `./agent-card`          | `schemas/agent-card.schema.json`          |
| `./artifact`            | `schemas/artifact.schema.json`            |
| `./json-rpc`            | `schemas/json-rpc.schema.json`            |
| `./message`             | `schemas/message.schema.json`             |
| `./registry-agent`      | `schemas/registry-agent.schema.json`      |
| `./registry-export`     | `schemas/registry-export.schema.json`     |
| `./registry-task-event` | `schemas/registry-task-event.schema.json` |
| `./task`                | `schemas/task.schema.json`                |

## License

Apache-2.0
