# a2a-warp conformance

Runs the A2A conformance fixture suite against an endpoint and emits a report.

```bash
a2a-warp conformance http://127.0.0.1:3000 --protocol-version 1.2 --json
a2a-warp conformance http://127.0.0.1:3000 --junit ./reports/a2a-conformance.xml
```

```powershell
a2a-warp conformance http://127.0.0.1:3000 --protocol-version 1.2 --json
a2a-warp conformance http://127.0.0.1:3000 --junit .\reports\a2a-conformance.xml
```

The command resolves the endpoint Agent Card, verifies requested protocol support, runs the versioned `message/send` fixture, records advertised capability metadata, and exits with status `1` when any required case fails. Optional capabilities that are not advertised are reported as skipped, not failed.

Shared network options such as `--header`, `--bearer-token`, `--api-key`, `--timeout-ms`, `--retries`, `--request-id`, and `--origin` are supported.

## JSON Report Schema

`--json` emits a stable report object:

```json
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-05-25T00:00:00.000Z",
  "package": {
    "name": "a2a-warp",
    "version": "1.0.3"
  },
  "protocolVersion": "1.2",
  "endpoint": {
    "url": "http://127.0.0.1:3000",
    "protocolVersion": "1.2",
    "agentName": "Example Agent",
    "agentVersion": "1.0.0",
    "capabilities": {
      "streaming": true,
      "pushNotifications": false,
      "stateTransitionHistory": true,
      "extendedAgentCard": true
    },
    "supportedInterfaces": []
  },
  "summary": {
    "total": 7,
    "passed": 6,
    "failed": 0,
    "skipped": 1,
    "requiredFailed": 0,
    "durationMs": 12
  },
  "cases": [
    {
      "id": "message-send",
      "name": "Run the message/send conformance fixture",
      "required": true,
      "status": "pass",
      "durationMs": 4,
      "metadata": {
        "taskId": "task-1",
        "taskState": "COMPLETED",
        "artifactCount": 1
      }
    }
  ],
  "skippedCapabilities": [
    {
      "capability": "pushNotifications",
      "reason": "Capability is not advertised"
    }
  ]
}
```

Case `status` is one of `pass`, `fail`, or `skip`. Required failures increment `summary.requiredFailed` and make the command return a nonzero exit code.

## JUnit Output

Use `--junit <path>` to write CI-compatible JUnit XML. The XML includes one `<testcase>` per report case, `<failure>` entries for failed cases, and `<skipped>` entries for skipped optional capabilities.
