# Self-hosted deployment — Proxmox + Docker

This stack runs Design Workshop fully self-contained on a Proxmox LXC or
VM. Three services on an internal docker network, one host port exposed
to your reverse proxy.

```
browser ──► your-reverse-proxy (TLS) ──► host:${PUBLIC_PORT}
                                              │
                                              ▼
                                          frontend (nginx)
                                          ├── /         → React SPA
                                          └── /api/*    → backend (uvicorn)
                                                          ├── mongo:4.4
                                                          └── /var/uploads (volume)
```

`mongo:4.4` is pinned because anything 5.0+ requires CPU AVX support.

---

## 1. Prerequisites

On the Proxmox guest (LXC container or VM):

- Docker Engine ≥ 24
- Docker Compose plugin (`docker compose version` should print v2.x)
- Outbound HTTPS to:
  - `accounts.google.com` / `oauth2.googleapis.com` (Google OAuth)
  - Any external sites your `Products` sections scrape (optional)
- A reverse proxy in front of the box (nginx-proxy-manager / Caddy / Traefik)
  terminating TLS for `designworkshop.zaibatsui.co.uk` and forwarding to
  `http://<this-box>:${PUBLIC_PORT}`. Make sure it sets `X-Forwarded-Proto`
  and `X-Forwarded-Host` — the OAuth callback flow needs those.

LXC notes: if you're using an unprivileged container, mount `/var/lib/docker`
on a directory that allows sub-uid mappings, and add `lxc.apparmor.profile = unconfined`
+ `lxc.cgroup2.devices.allow: a` to the container config so docker can run
nested.

---

## 2. First-time deploy

```bash
git clone https://github.com/<you>/<repo>.git design-workshop
cd design-workshop

# 1. Copy the env template and fill in real values.
cp deploy/.env.example deploy/.env
${EDITOR:-vi} deploy/.env

# 2. Build + start the stack (compose will pull mongo:4.4 and build the
#    backend + frontend images on first run).
docker compose --env-file deploy/.env up -d --build

# 3. Tail logs until the backend reports "Application startup complete".
docker compose logs -f backend
```

The stack is now reachable on `http://<this-box>:${PUBLIC_PORT}`. Point
your reverse proxy at it.

### Reverse-proxy snippet (nginx)

```nginx
server {
    server_name designworkshop.zaibatsui.co.uk;
    listen 443 ssl http2;
    # ... your TLS bits ...

    location / {
        proxy_pass http://<proxmox-host-ip>:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host  $host;
        client_max_body_size 12M;
    }
}
```

### Reverse-proxy snippet (Caddy)

```
designworkshop.zaibatsui.co.uk {
    reverse_proxy <proxmox-host-ip>:8080 {
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-Host  {host}
    }
}
```

---

## 3. Google OAuth — add the production redirect URI

In Google Cloud Console → APIs & Services → Credentials → your existing
OAuth 2.0 Client → **Authorized redirect URIs**, add:

```
https://designworkshop.zaibatsui.co.uk/api/auth/google/callback
```

You can keep the old preview URI alongside it.

---

## 4. Migrating data from the preview environment

There are two things to copy: MongoDB documents and the binary files
already uploaded to the preview's object storage.

### 4a. Mongo

Run inside the source environment (the preview pod's shell):

```bash
# In the preview pod:
cd /app/deploy/scripts
./export-mongo.sh /tmp/dw-dump.archive
```

Copy that archive to the Proxmox host, then:

```bash
# On the Proxmox host, with the stack already running:
./deploy/scripts/import-mongo.sh /path/to/dw-dump.archive
```

The script restores into the DB name configured in `deploy/.env` and
remaps from the preview's `test_database` automatically.

### 4b. Uploaded images

While the preview environment is still up, run inside the new backend
container:

```bash
docker compose exec backend python /app/deploy/scripts/migrate-uploads.py \
    --source https://content-forge-1039.preview.emergentagent.com \
    --target https://designworkshop.zaibatsui.co.uk
```

Add `--dry-run` first if you want a report of what would change without
writing anything.

The script:

1. Walks every section / page / template config in MongoDB.
2. Finds every URL that points at `<source>/api/files/<path>`.
3. Downloads each file via HTTP from the preview backend.
4. Writes the bytes to `/var/uploads/<path>` in the new compose volume.
5. Rewrites the URL in MongoDB to use `<target>` instead of `<source>`.

It's idempotent — re-running just verifies what's already on disk and
moves on. Once you've verified the new instance works end-to-end (log
in, edit a section, see images load), you can decommission the preview.

---

## 5. Day-2 ops

| Task                    | Command                                                     |
| ----------------------- | ----------------------------------------------------------- |
| Tail backend logs       | `docker compose logs -f backend`                            |
| Tail frontend logs      | `docker compose logs -f frontend`                           |
| Stop everything         | `docker compose down`                                       |
| Stop + delete data      | `docker compose down -v`  ⚠️ wipes mongo + uploads          |
| Update after `git pull` | `docker compose --env-file deploy/.env up -d --build`       |
| Backup mongo            | `./deploy/scripts/export-mongo.sh /backups/dw-$(date +%F).archive` (run via cron) |
| Backup uploads          | `docker run --rm -v design-workshop_uploads-data:/src -v $(pwd):/dst alpine tar czf /dst/uploads-$(date +%F).tgz -C /src .` |
| Open a mongo shell      | `docker compose exec mongo mongo $DB_NAME`                  |

---

## 6. Things that are NOT in this stack

- **TLS termination**: do that on your existing reverse proxy. Cleaner than
  baking certbot into the container.
- **MongoDB auth**: the mongo service is reachable only over the docker
  internal network and never published to the host. If you need on-disk
  encryption or auth, add it as a follow-up — not strictly required for
  a single-tenant deployment.
- **External object storage / S3**: this build uses local filesystem
  storage in a docker volume. If you outgrow that, you can swap
  `backend/storage.py` for a MinIO or S3 client without changing the
  upload router's contract.
- **Health checks**: compose has no `healthcheck:` blocks. If you want
  k8s-style restart-on-failure, add `healthcheck` entries pointing at
  `/api/` (backend) and `/` (frontend).
