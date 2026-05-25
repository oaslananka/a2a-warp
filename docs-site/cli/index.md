# CLI

<!-- Synced from scripts/generate-command-docs.mjs. -->

A2A Warp developer CLI

## Usage

```text
Usage: a2a-warp [options] [command]

A2A Warp developer CLI

Options:
  -V, --version                    output the version number
  --json                           Machine-readable JSON output
  -h, --help                       display help for command

Commands:
  discover [options] <url>         Resolve and print an endpoint Agent Card.
  scaffold [options] <agent-name>  Create an A2A agent project scaffold.
  task                             Run task lifecycle operations.
  send [options] <url> <message>   Send a text message to an A2A endpoint.
  registry                         Start, inspect, export, and import registry
                                   state.
  health [options] <url>           Check an A2A endpoint health route.
  validate [options] <target>      Validate an Agent Card file or endpoint.
  monitor [options] <url>          Poll task status snapshots.
  benchmark [options] <url>        Run request benchmarks against an A2A
                                   endpoint.
  conformance [options] <url>      Run the A2A conformance fixture suite.
  doctor                           Print local CLI diagnostics.
  export-card [options] <url>      Export an endpoint Agent Card to JSON.
  help [command]                   display help for command
```

## Commands

| Command                | Summary                                            |
| ---------------------- | -------------------------------------------------- |
| `a2a-warp benchmark`   | Run request benchmarks against an A2A endpoint.    |
| `a2a-warp conformance` | Run the A2A conformance fixture suite.             |
| `a2a-warp discover`    | Resolve and print an endpoint Agent Card.          |
| `a2a-warp doctor`      | Print local CLI diagnostics.                       |
| `a2a-warp export-card` | Export an endpoint Agent Card to JSON.             |
| `a2a-warp health`      | Check an A2A endpoint health route.                |
| `a2a-warp monitor`     | Poll task status snapshots.                        |
| `a2a-warp registry`    | Start, inspect, export, and import registry state. |
| `a2a-warp scaffold`    | Create an A2A agent project scaffold.              |
| `a2a-warp send`        | Send a text message to an A2A endpoint.            |
| `a2a-warp task`        | Run task lifecycle operations.                     |
| `a2a-warp validate`    | Validate an Agent Card file or endpoint.           |

## Shared Network Options

Network commands accept the same request options where applicable: `--header <key:value...>`, `--bearer-token <token>`, `--api-key <name:value>`, `--timeout-ms <ms>`, `--retries <count>`, `--request-id <id>`, and `--origin <url>`.

Secret-bearing values are sent in request headers only; JSON output and validation errors must not echo bearer tokens, API key values, or full auth headers.
