FROM node:24-alpine@sha256:a1db41e58b58674705e9c5f886ab62fd906562087ee797632d3a30ed87219c4c

WORKDIR /app
ENV CI=true
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig*.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/adapters/package.json ./packages/adapters/
COPY packages/transport-grpc/package.json ./packages/transport-grpc/
COPY packages/registry/package.json ./packages/registry/
COPY cli/package.json ./cli/
COPY apps/demo/package.json ./apps/demo/

RUN pnpm install --frozen-lockfile --filter a2a-warp-demo...

COPY . .
RUN pnpm --filter a2a-warp-demo... run build

WORKDIR /app/apps/demo
USER node
CMD ["node", "dist/main.js"]
