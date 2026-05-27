# Release Process

1. Merge ordinary changes through pull requests.
2. Let Release Please propose version and changelog updates.
3. Verify `pnpm run verify` locally.
4. Owner dispatches publish workflow with the explicit confirmation input.
5. Publish workflow packs packages, smoke-installs tarballs, creates SHA-256 checksums, writes a CycloneDX SBOM at `.artifacts/sbom/a2a-warp.cdx.json`, emits GitHub artifact attestations for release artifacts, and publishes through npm Trusted Publishing/OIDC with provenance.

Do not create tags, GitHub Releases, npm publishes, or container pushes during the rebuild contract without owner instruction.

Local release validation uses the same commands on Linux/macOS and Windows.

Linux/macOS:

```bash
pnpm run verify
pnpm run release:dry-run
pnpm run release:validate
```

PowerShell:

```powershell
pnpm run verify
pnpm run release:dry-run
pnpm run release:validate
```
