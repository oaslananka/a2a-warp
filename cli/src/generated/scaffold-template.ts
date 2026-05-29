// This file is written by scripts/build-tsc-package.mjs from workspace manifests and tools/runtime-versions.json.
export const scaffoldTemplateConfig = {
  dependencies: {
    '@oaslananka/a2a-warp': '^1.2.0',
    '@oaslananka/a2a-warp-adapters': '^1.2.0',
    '@oaslananka/a2a-warp-registry': '^1.2.0',
    '@anthropic-ai/sdk': '^0.96.0',
    langchain: '^0.3.37 || ^1.0.0',
    openai: '6.38.0',
    zod: '^4.4.3',
  },
  devDependencies: {
    '@types/node': '22.19.19',
    tsx: '4.22.3',
    typescript: '6.0.3',
  },
  runtime: {
    node: '24.16.0',
    nodeDockerAlpineDigest:
      'sha256:2bdb65ed1dab192432bc31c95f94155ca5ad7fc1392fb7eb7526ab682fa5bf14',
    pnpm: '11.3.0',
  },
} as const;
