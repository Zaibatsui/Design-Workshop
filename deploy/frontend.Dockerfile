# Frontend image — multi-stage. Stage 1 builds the React bundle with the
# REACT_APP_BACKEND_URL baked in (CRA injects env vars at build time, not
# runtime). Stage 2 serves the static bundle through nginx and reverse-
# proxies /api/* to the backend service over the docker network.

# ---------- Stage 1: build ----------
FROM node:20-alpine AS build

WORKDIR /app

# REACT_APP_BACKEND_URL must be the public origin the browser will hit
# (e.g. https://designworkshop.zaibatsui.co.uk). Same-origin in production
# means /api/* on the same host as the SPA — see deploy/nginx.conf.
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
# CRA dev-server hot-reload env vars; harmless at build time but explicitly
# unset so they don't leak into the production bundle.
ENV WDS_SOCKET_PORT=0

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000

COPY frontend/ ./
RUN yarn build

# ---------- Stage 2: serve ----------
FROM nginx:1.27-alpine

# Replace nginx's default site with our SPA + /api proxy config.
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
