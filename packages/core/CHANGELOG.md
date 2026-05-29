# Changelog

## [1.2.0](https://github.com/oaslananka/a2a-warp/compare/@oaslananka/a2a-warp-v1.1.0...@oaslananka/a2a-warp-v1.2.0) (2026-05-28)


### Features

* **core:** add async task storage ([#21](https://github.com/oaslananka/a2a-warp/issues/21)) ([762520c](https://github.com/oaslananka/a2a-warp/commit/762520cfa94c03d88596b40a92dea2b64521df09))
* **core:** generate public json schemas ([#20](https://github.com/oaslananka/a2a-warp/issues/20)) ([b6c40d1](https://github.com/oaslananka/a2a-warp/commit/b6c40d1ab1e62db7e968743623bc626b9f20ae51))
* **registry:** add export import commands ([7084e53](https://github.com/oaslananka/a2a-warp/commit/7084e538750062cb20bfcf7ef9da9b745af20f99))


### Bug Fixes

* **core:** centralize outbound policy ([#17](https://github.com/oaslananka/a2a-warp/issues/17)) ([d2ac0a8](https://github.com/oaslananka/a2a-warp/commit/d2ac0a88dc79144cb7fdad9c54b3c4f8cecf4126))
* **core:** enforce outbound policy for oidc ([#16](https://github.com/oaslananka/a2a-warp/issues/16)) ([5a091d6](https://github.com/oaslananka/a2a-warp/commit/5a091d6b2d0e03b59eba404a657cf017e8af67d7))
* **core:** reject json-rpc batch requests ([#18](https://github.com/oaslananka/a2a-warp/issues/18)) ([2f85db6](https://github.com/oaslananka/a2a-warp/commit/2f85db677d3c13b814e74b2b93b2d69a7edea319))
* **core:** validate message timestamps ([#15](https://github.com/oaslananka/a2a-warp/issues/15)) ([82cd7d2](https://github.com/oaslananka/a2a-warp/commit/82cd7d2828329fbb0d7f59aa06c3f77680354357))
* protect main, fix Docker/version issues, sync runtime ([#59](https://github.com/oaslananka/a2a-warp/issues/59), [#63](https://github.com/oaslananka/a2a-warp/issues/63), [#91](https://github.com/oaslananka/a2a-warp/issues/91), [#103](https://github.com/oaslananka/a2a-warp/issues/103)) ([#110](https://github.com/oaslananka/a2a-warp/issues/110)) ([a1d74e0](https://github.com/oaslananka/a2a-warp/commit/a1d74e033dbd1f1b4c957334c3333647a8fba567))
* **protocol:** default to official A2A 1.0 ([#100](https://github.com/oaslananka/a2a-warp/issues/100)) ([e74f42b](https://github.com/oaslananka/a2a-warp/commit/e74f42bed04091e7af5bf3f4f60c98f12b68ca86))
* **security:** domain-separate idempotency fingerprints ([#94](https://github.com/oaslananka/a2a-warp/issues/94)) ([292cbe9](https://github.com/oaslananka/a2a-warp/commit/292cbe927634aa5d595e4e1b211b62e3307a8914))

## [1.1.0](https://github.com/oaslananka/a2a-warp/compare/@oaslananka/a2a-warp-v1.0.0...@oaslananka/a2a-warp-v1.1.0) (2026-05-28)


### Features

* **core:** add async task storage ([#21](https://github.com/oaslananka/a2a-warp/issues/21)) ([762520c](https://github.com/oaslananka/a2a-warp/commit/762520cfa94c03d88596b40a92dea2b64521df09))
* **core:** generate public json schemas ([#20](https://github.com/oaslananka/a2a-warp/issues/20)) ([b6c40d1](https://github.com/oaslananka/a2a-warp/commit/b6c40d1ab1e62db7e968743623bc626b9f20ae51))
* **registry:** add export import commands ([7084e53](https://github.com/oaslananka/a2a-warp/commit/7084e538750062cb20bfcf7ef9da9b745af20f99))


### Bug Fixes

* **core:** centralize outbound policy ([#17](https://github.com/oaslananka/a2a-warp/issues/17)) ([d2ac0a8](https://github.com/oaslananka/a2a-warp/commit/d2ac0a88dc79144cb7fdad9c54b3c4f8cecf4126))
* **core:** enforce outbound policy for oidc ([#16](https://github.com/oaslananka/a2a-warp/issues/16)) ([5a091d6](https://github.com/oaslananka/a2a-warp/commit/5a091d6b2d0e03b59eba404a657cf017e8af67d7))
* **core:** reject json-rpc batch requests ([#18](https://github.com/oaslananka/a2a-warp/issues/18)) ([2f85db6](https://github.com/oaslananka/a2a-warp/commit/2f85db677d3c13b814e74b2b93b2d69a7edea319))
* **core:** validate message timestamps ([#15](https://github.com/oaslananka/a2a-warp/issues/15)) ([82cd7d2](https://github.com/oaslananka/a2a-warp/commit/82cd7d2828329fbb0d7f59aa06c3f77680354357))
* protect main, fix Docker/version issues, sync runtime ([#59](https://github.com/oaslananka/a2a-warp/issues/59), [#63](https://github.com/oaslananka/a2a-warp/issues/63), [#91](https://github.com/oaslananka/a2a-warp/issues/91), [#103](https://github.com/oaslananka/a2a-warp/issues/103)) ([#110](https://github.com/oaslananka/a2a-warp/issues/110)) ([a1d74e0](https://github.com/oaslananka/a2a-warp/commit/a1d74e033dbd1f1b4c957334c3333647a8fba567))
* **protocol:** default to official A2A 1.0 ([#100](https://github.com/oaslananka/a2a-warp/issues/100)) ([e74f42b](https://github.com/oaslananka/a2a-warp/commit/e74f42bed04091e7af5bf3f4f60c98f12b68ca86))
* **security:** domain-separate idempotency fingerprints ([#94](https://github.com/oaslananka/a2a-warp/issues/94)) ([292cbe9](https://github.com/oaslananka/a2a-warp/commit/292cbe927634aa5d595e4e1b211b62e3307a8914))

## [1.0.3](https://github.com/oaslananka/a2a-warp/compare/@oaslananka/a2a-warp-v1.0.2...@oaslananka/a2a-warp-v1.0.3) (2026-05-19)


### Miscellaneous Chores

* **@oaslananka/a2a-warp:** Synchronize A2A Warp packages versions

## [1.0.2](https://github.com/oaslananka/a2a-warp/compare/@oaslananka/a2a-warp-v1.0.1...@oaslananka/a2a-warp-v1.0.2) (2026-05-19)

### Bug Fixes

- refresh may 2026 stability baseline ([9fd0089](https://github.com/oaslananka/a2a-warp/commit/9fd0089192324a013334633d816fb89e4a60b99b))

## [1.0.1](https://github.com/oaslananka/a2a-warp/compare/@oaslananka/a2a-warp-v1.0.0...@oaslananka/a2a-warp-v1.0.1) (2026-05-19)

### Miscellaneous Chores

- **@oaslananka/a2a-warp:** Synchronize A2A Warp packages versions
