# FAQ

## Is A2A Warp an official protocol package?

No. It is an independent TypeScript runtime and toolkit for the Agent2Agent protocol.

## Does normal CI publish packages?

No. Normal CI performs dry-run and pack checks only.

## What package managers are supported?

pnpm is the repository package manager. Workspace scripts and lockfile consistency require pnpm `>=11 <12`. Individual packages can be installed with npm or yarn when consumed from the npm registry.

```bash
npm install @oaslananka/a2a-warp
yarn add @oaslananka/a2a-warp
```

## How do I install the CLI globally?

```bash
pnpm add --global @oaslananka/a2a-warp-cli
```

or via npm:

```bash
npm install --global @oaslananka/a2a-warp-cli
```

After install, run `a2a-warp --help` to see available commands.

## What is the minimum Node.js version?

Node.js `>=22.22.1 <25`. See [Compatibility](compatibility.md) for the full runtime matrix.

## Does A2A Warp support streaming?

Yes. The protocol runtime supports JSON-RPC streaming over HTTP SSE. The `streaming` capability is advertised in the agent card.

## What is the registry?

The registry is a server that stores agent cards, supports health monitoring, tenant isolation, and SSE-based live updates. See the `a2a-warp registry` CLI subcommands and the `@oaslananka/a2a-warp-registry` package.

## How do I report a security issue?

See [Security policy](security/threat-model.md) or open a GitHub Security Advisory.
