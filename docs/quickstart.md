# Quickstart

## Scaffold a project

pnpm:

```bash
pnpm create a2a-warp demo
cd demo
pnpm install
pnpm run dev
```

npm:

```bash
npm create a2a-warp demo
cd demo
npm install
npm run dev
```

yarn:

```bash
yarn create a2a-warp demo
cd demo
yarn install
yarn run dev
```

PowerShell:

```powershell
pnpm create a2a-warp demo
Set-Location demo
pnpm install
pnpm run dev
```

The generated project uses `@oaslananka/a2a-warp` and optional adapters when templates are selected.

## Try the CLI

Install the CLI globally:

```bash
pnpm add --global @oaslananka/a2a-warp-cli
```

After you have an agent running, check its health:

```bash
a2a-warp health http://localhost:41234
```

Discover its agent card:

```bash
a2a-warp discover http://localhost:41234
```

Send a message:

```bash
a2a-warp send http://localhost:41234 --text "Hello agent"
```

## Start a local registry

```bash
a2a-warp registry start --port 3099
```

See `a2a-warp registry --help` for subcommands.

## Examples

For deployment-mode examples that run without paid external services, see [Examples](examples.md).
