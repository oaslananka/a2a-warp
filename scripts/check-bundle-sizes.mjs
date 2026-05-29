import { stat } from 'node:fs/promises';

const LIMITS = {
  '@oaslananka/a2a-warp': { esm: 120_000, cjs: 130_000 },
  '@oaslananka/a2a-warp-adapters': { esm: 80_000, cjs: 85_000 },
  '@oaslananka/a2a-warp-registry': { esm: 60_000, cjs: 65_000 },
  '@oaslananka/a2a-warp-cli': { esm: 200_000, cjs: 210_000 },
};

const BUNDLE_LIMITS = [
  { name: '@oaslananka/a2a-warp', format: 'esm', path: 'packages/core/dist/index.mjs' },
  { name: '@oaslananka/a2a-warp', format: 'cjs', path: 'packages/core/dist/index.cjs' },
  {
    name: '@oaslananka/a2a-warp-adapters',
    format: 'esm',
    path: 'packages/adapters/dist/index.mjs',
  },
  {
    name: '@oaslananka/a2a-warp-adapters',
    format: 'cjs',
    path: 'packages/adapters/dist/index.cjs',
  },
  {
    name: '@oaslananka/a2a-warp-registry',
    format: 'esm',
    path: 'packages/registry/dist/index.mjs',
  },
  {
    name: '@oaslananka/a2a-warp-registry',
    format: 'cjs',
    path: 'packages/registry/dist/index.cjs',
  },
  { name: '@oaslananka/a2a-warp-cli', format: 'esm', path: 'cli/dist/index.mjs' },
  { name: '@oaslananka/a2a-warp-cli', format: 'cjs', path: 'cli/dist/index.cjs' },
];

let hasFailure = false;

for (const bundle of BUNDLE_LIMITS) {
  const maxSize = LIMITS[bundle.name][bundle.format];
  const info = await stat(bundle.path);
  const sizeKb = info.size / 1024;
  const maxSizeKb = maxSize / 1024;

  if (info.size > maxSize) {
    hasFailure = true;
    console.error(
      `Bundle size check failed for ${bundle.path}: ${sizeKb.toFixed(1)} kB > ${maxSizeKb.toFixed(1)} kB`,
    );
  } else {
    console.log(
      `Bundle size OK for ${bundle.path}: ${sizeKb.toFixed(1)} kB <= ${maxSizeKb.toFixed(1)} kB`,
    );
  }
}

if (hasFailure) {
  process.exitCode = 1;
}
