FROM node:20-alpine AS base
WORKDIR /app

# Only build mcp-proxy for Cloud Run
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY apps/mcp-proxy ./apps/mcp-proxy
COPY packages/shared ./packages/shared

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
RUN pnpm --filter @datalens/shared i && pnpm --filter @datalens/shared build
RUN pnpm --filter @datalens/mcp-proxy i && pnpm --filter @datalens/mcp-proxy build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=base /app/apps/mcp-proxy/dist ./dist
COPY --from=base /app/apps/mcp-proxy/package.json ./package.json
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate && pnpm i --prod --ignore-scripts
EXPOSE 8787
CMD ["node", "dist/index.js"]

