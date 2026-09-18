# syntax=docker/dockerfile:1
#
# Omahe landing — multi-stage untuk self-host/Docker.
#
# Strategi runtime (CLAUDE.md §Stack: produksi = Node, Bun cuma lokal):
#   - BUILD pakai Bun (`oven/bun`) — install & `vite build` jauh lebih cepat.
#   - RUN pakai Node 24 — runtime yang didukung resmi `@sveltejs/adapter-node`,
#     sekaligus konsisten dengan runtime produksi Vercel (Node function).
#
# Build ini env-agnostic: seluruh env app memakai `$env/dynamic/*` (dibaca saat
# runtime, TIDAK di-inline saat build), jadi satu image bisa dipakai lintas
# environment cukup dengan mengganti env container.

ARG BUN_VERSION=1.2
ARG NODE_VERSION=24-alpine

# --- Stage 1: dependencies produksi (layer terpisah agar cache stabil) -------
FROM oven/bun:${BUN_VERSION} AS prod-deps
WORKDIR /app
COPY package.json bun.lock .npmrc ./
# Skrip `prepare` gagal tanpa devDeps — sudah di-guard `|| echo ''` di package.json.
RUN bun install --frozen-lockfile --production

# --- Stage 2: build ----------------------------------------------------------
FROM oven/bun:${BUN_VERSION} AS build
WORKDIR /app
COPY package.json bun.lock .npmrc ./
RUN bun install --frozen-lockfile
COPY . .
# Pilih adapter-node (bukan adapter-vercel default) — lihat vite.config.ts.
RUN OMAHE_ADAPTER=node bun run build

# --- Stage 3: runtime --------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    # Agar URL absolut (canonical, og:url, dsb.) benar di belakang reverse proxy.
    PROTOCOL_HEADER=x-forwarded-proto \
    HOST_HEADER=x-forwarded-host
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT??3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "build"]
