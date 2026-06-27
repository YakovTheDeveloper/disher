# syntax=docker/dockerfile:1
#
# Multi-stage build for @disher/backend (Fastify 5, ESM, pnpm monorepo).
#
# Build context MUST be the REPO ROOT (compose: build.context: ../..,
# dockerfile: apps/disher-backend-3.0/Dockerfile) — the pnpm workspace install
# needs pnpm-workspace.yaml, the lockfile, tsconfig.base.json and EVERY member's
# package.json (apps/disher-backend-3.0 + apps/food-calc).
#
# Why a builder stage instead of trusting `pnpm deploy` to ship everything:
#   `pnpm --prod deploy` honours .gitignore, and BOTH `dist/` and `data/` are
#   gitignored. So the deploy output carries the prod node_modules + source, but
#   NOT the compiled JS and NOT the embeddings. We therefore `tsc` in the builder
#   and COPY dist/ + the two data JSONs + content/ from the builder explicitly.
#
# Runtime asset paths are resolved relative to dist/src/api/ (see food-matcher.ts
# and buildApp.ts):
#   ../../data/food-embeddings.json -> /app/dist/data/food-embeddings.json
#   ../../data/food-aliases.json    -> /app/dist/data/food-aliases.json
#   ../../content                   -> /app/dist/content
#   ../../../food-calc/.../catalog.json -> ABSENT on purpose (shouldRegenerate()
#       returns false when the frontend seed is missing but embeddings exist).

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — builder: install workspace deps, compile TS, warm the HF model,
#                    then produce a self-contained prod node_modules tree.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS builder

# Toolchain for native addons (better-sqlite3, onnxruntime-node via @xenova).
# Prebuilt binaries usually cover these, but keep python3/make/g++ as a fallback
# so a source build never fails the image.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# pnpm via corepack, pinned to the repo's packageManager (pnpm@9.0.0).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /repo

# Workspace manifests first — this layer (the install) is cached as long as the
# manifests + lockfile are unchanged, even when source files change.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY apps/disher-backend-3.0/package.json apps/disher-backend-3.0/package.json
COPY apps/food-calc/package.json apps/food-calc/package.json

# Install only the backend subgraph (food-calc source is never needed here —
# its manifest is present solely so the frozen lockfile validates).
RUN pnpm install --frozen-lockfile --filter @disher/backend...

# Backend source + assets (the rest of the context; .dockerignore trims the fat).
COPY apps/disher-backend-3.0/ apps/disher-backend-3.0/

# Compile: tsc -p tsconfig.build.json -> dist/src/... (+ dist/scripts/, harmless).
RUN pnpm --filter @disher/backend build

# Bake the embedding model into a cache dir the runtime will read offline.
# (@xenova v2 ignores HF_HOME/TRANSFORMERS_CACHE; env.cacheDir == MODEL_CACHE_DIR
# is the only knob it honours. food-matcher.ts runs allowRemoteModels=false in
# prod, so the model MUST already be on disk.)
RUN MODEL_CACHE_DIR=/repo/.hfcache node apps/disher-backend-3.0/scripts/warm-model.mjs

# Self-contained prod node_modules + package.json (no dist, no data — gitignored).
RUN pnpm --filter @disher/backend --prod deploy /repo/out

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — runtime: slim, non-root, no build toolchain. Same base as the
#           builder so the native addons copied below are ABI-compatible.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3100 \
    MODEL_CACHE_DIR=/app/.hfcache \
    ANALYTICS_DB_PATH=/app/state/analytics.db

WORKDIR /app

# Prod dependency tree + manifest from the deploy output.
COPY --from=builder --chown=node:node /repo/out/node_modules ./node_modules
COPY --from=builder --chown=node:node /repo/out/package.json ./package.json

# Compiled JS (entry: dist/src/api/server.js).
COPY --from=builder --chown=node:node /repo/apps/disher-backend-3.0/dist ./dist

# Runtime assets read from dist-relative paths (see header). The embeddings and
# aliases are gitignored, so they come straight from the builder's source tree.
COPY --from=builder --chown=node:node /repo/apps/disher-backend-3.0/data/food-embeddings.json ./dist/data/food-embeddings.json
COPY --from=builder --chown=node:node /repo/apps/disher-backend-3.0/data/food-aliases.json ./dist/data/food-aliases.json
COPY --from=builder --chown=node:node /repo/apps/disher-backend-3.0/content ./dist/content

# Pre-warmed model cache (loaded offline at runtime via MODEL_CACHE_DIR).
COPY --from=builder --chown=node:node /repo/.hfcache ./.hfcache

# Writable dirs for runtime state. Creating them in the image owned by `node`
# means a fresh NAMED volume mounted here inherits node ownership (Docker copies
# the image dir's content + perms into an empty named volume) — so USER node can
# write without a root-owned-volume foot-gun. Keep these OFF the baked assets:
#   /app/state               -> sqlite analytics.db (ANALYTICS_DB_PATH)
#   /app/dist/data/telemetry -> matcher telemetry jsonl (sibling to embeddings)
#   /app/dist/logs           -> llm-output / matcher-queries jsonl
RUN mkdir -p /app/state /app/dist/data/telemetry /app/dist/logs \
  && chown -R node:node /app/state /app/dist/data /app/dist/logs

USER node

EXPOSE 3100

# Readiness gates on Postgres reachable AND the matcher initialized (model loaded
# + warmup inference done). Generous start-period covers cold model load. Uses
# node's global fetch so the slim image needs no curl/wget; explicit process.exit
# tears down the keep-alive socket so the probe never hangs.
HEALTHCHECK --interval=15s --timeout=10s --start-period=180s --retries=5 \
  CMD ["node","-e","fetch('http://127.0.0.1:'+(process.env.PORT||3100)+'/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/src/api/server.js"]
