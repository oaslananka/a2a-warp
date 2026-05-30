FROM node:24-alpine@sha256:9a2c6269f83d74af45665c0b738b78c7b5f07bf2374c72a4c540065a975b9693

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
