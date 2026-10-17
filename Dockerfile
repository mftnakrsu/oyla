# syntax=docker/dockerfile:1

# ---- build: install everything, build the web app and the server bundle ----
FROM node:24-bookworm-slim AS build
WORKDIR /app
# Toolchain only as a fallback in case better-sqlite3 has no prebuilt binary for this platform.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
RUN npm ci --no-audit --no-fund
COPY tsconfig.base.json ./
COPY packages ./packages
RUN npm run build && npm prune --omit=dev --no-audit --no-fund

# ---- runtime: only what the server needs ----
FROM node:24-bookworm-slim
ENV NODE_ENV=production \
    PORT=3000 \
    OYLA_DB_PATH=/data/oyla.db
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/server/package.json ./packages/server/
COPY --from=build /app/packages/server/dist ./packages/server/dist
COPY --from=build /app/packages/server/drizzle ./packages/server/drizzle
COPY --from=build /app/packages/web/dist ./packages/web/dist
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "packages/server/dist/index.js"]
