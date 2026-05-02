# Frontend image — multi-stage. Stage 1 builds the React bundle with the
# REACT_APP_BACKEND_URL baked in (CRA injects env vars at build time, not
# runtime). Stage 2 serves the static bundle through nginx and reverse-
# proxies /api/* to the backend service over the docker network.
#
# Uses npm instead of yarn so the build works on hosts that don't have
# yarn / Corepack enabled. `npm install` is non-deterministic relative
# to `npm ci` but that's a fine trade-off for a self-host deploy where
# you control the host and the repo.

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# REACT_APP_BACKEND_URL must be the public origin the browser will hit
# (e.g. https://designworkshop.zaibatsui.co.uk). Same-origin in production
# means /api/* on the same host as the SPA — see deploy/nginx.conf.
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
# CRA dev-server hot-reload var; harmless at build time but explicitly
# unset so it doesn't leak into the production bundle.
ENV WDS_SOCKET_PORT=0

# Disable Corepack — package.json declares `packageManager: yarn@1.22`
# which Corepack will otherwise force; we want npm regardless.
ENV COREPACK_ENABLE_STRICT=0

# Install dependencies first so the layer caches across code changes.
# Copying just the manifest (no lockfile required) means a missing
# package-lock.json is fine — npm will resolve the tree from package.json.
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund --legacy-peer-deps

COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine

# Replace nginx's default site with our SPA + /api proxy config.
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
