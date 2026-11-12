# syntax=docker/dockerfile:1
# Backend (NestJS) image, built from the monorepo root so npm workspaces resolve.
# Railway: point the service at this Dockerfile with the repo root as context.

# ---------- build: install the whole workspace, compile the backend ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copy manifests first for better layer caching. All workspace package.json files
# are needed so `npm ci` can validate against the root lockfile.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# Install from the root — this is what makes any @vanilla/* workspace package
# resolve locally instead of being fetched from the public npm registry.
RUN npm ci

# Bring in the sources and build only the backend.
COPY packages ./packages
COPY backend ./backend
RUN npm --workspace backend run build

# ---------- runtime: lean image, backend production deps only ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# The backend is self-contained (it imports no workspace packages), so its
# production dependencies install cleanly on their own.
COPY backend/package.json ./package.json
RUN npm install --omit=dev --no-audit --no-fund

# Compiled JavaScript only.
COPY --from=build /app/backend/dist ./dist

EXPOSE 4000
CMD ["node", "dist/main.js"]
