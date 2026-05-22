# Contributing

Thanks for helping improve A2A Warp.

## Local workflow

1. Use Node `24.15.0` and pnpm `11.1.3` by default (`.node-version`, `.nvmrc`, and `packageManager` are the source of truth).
2. Install dependencies with `pnpm run setup`.
3. Run focused tests while iterating.
4. Run `pnpm run ui:install:browsers` once per machine before the full UI smoke path.
5. Run `pnpm run verify` before opening a PR.

## Pull requests

1. Open PRs against `main` on the public collaboration surface in use.
2. Add tests for every public behavior change.
3. Add or update docs when user-facing behavior changes.
4. Use Conventional Commit messages so release-please can derive versions.
5. Keep PRs focused and release-note friendly.

## CI and releases

Local git hooks are intentionally tiered:

- `pre-commit`: staged formatting + staged lint only
- `pre-push`: `pnpm run verify`

To verify your change before submitting a PR, run the full check suite:

```bash
pnpm install --frozen-lockfile
pnpm run ui:install:browsers
pnpm run verify
```

Releases are cut by release-please manifest mode after changes merge to `main`.
Version numbers are derived from Conventional Commit history and the
`.release-please-manifest.json` state.

Maintainers can validate the release configuration with:

```bash
pnpm run release:dry-run
```

Detailed local setup guidance lives in [docs/development/setup.md](./docs/development/setup.md).
