# Changelog

## Unreleased

## 9.0.1 - 2026-06-11

### Fixed
- Added org-only guard (`github.repository_owner`) to all CI/CD workflow jobs.
- Added `.github/dependabot.yml` for GitHub Actions security updates.

### Changed
- Updated prettier from 3.8.3 to 3.8.4.
- Updated typescript-eslint from 8.60.0 to 8.61.0.

## 1.0.0 - 2026-05-18

Initial A2A Warp release baseline.

- Renamed public identity to A2A Warp and repository identity to `oaslananka/a2a-warp`.
- Normalized publishable package versions to `1.0.0`.
- Scoped public packages under `@oaslananka/a2a-warp*` and kept `create-a2a-warp` for scaffolding.
- Added identity, package, public-surface, release-config, generated-artifact, command-doc, and secret scans.
- Reworked release and publish automation so normal CI performs dry-run package checks and owner-triggered publishing uses npm Trusted Publishing/OIDC.
