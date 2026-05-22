# Release Process

1. Merge ordinary changes through pull requests.
2. Let Release Please propose version and changelog updates.
3. Verify `pnpm run verify` locally.
4. Owner dispatches publish workflow with the explicit confirmation input.
5. Publish workflow packs packages, smoke-installs tarballs, creates SHA-256 checksums, and publishes through npm Trusted Publishing/OIDC with provenance.

Do not create tags, GitHub Releases, npm publishes, or container pushes during the rebuild contract without owner instruction.
