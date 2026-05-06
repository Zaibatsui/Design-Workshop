# Proxmox install — SSH walkthrough

End-to-end install of Design Workshop on a Proxmox host, via SSH, terminating at `https://designworkshop.zaibatsui.co.uk`.

This guide assumes:

- A Proxmox VE host you can `ssh root@<pve-host>` into.
- A domain you control (`designworkshop.zaibatsui.co.uk`) with DNS pointed at whatever box your reverse proxy listens on.
- A Google OAuth 2.0 Client ID + Secret you can edit (Google Cloud Console → APIs & Services → Credentials).
- An external reverse proxy (nginx-proxy-manager / Caddy / Traefik / nginx) already terminating TLS for the domain. If you don't have one yet, [§9](#9-reverse-proxy-snippets) has a Caddy and an NPM example.

The whole install takes about 15 minutes once the LXC is up.

---

## Layout you'll end up with

```
PVE host
└── LXC: design-workshop  (Debian 12, unprivileged, nesting+keyctl)
    ├── docker engine
    └── docker compose stack
        ├── mongo:4.4
        ├── backend  (FastAPI + Playwright)
        └── frontend (nginx + built React bundle, exposes :8080 to LXC)
```

Your reverse proxy points `https://designworkshop.zaibatsui.co.uk` at `<lxc-ip>:8080`.

---

## 1. Create the LXC container

Run on the **Proxmox host** (`ssh root@<pve-host>`).

If you have an LXC template handy:

```bash
pveam available --section system | grep debian-12
pveam download local debian-12-standard_12.7-1_amd64.tar.zst   # or whatever your `available` shows
```

Then create the container. Bump CPU/RAM/disk to taste — Design Workshop is light, but the Playwright image and the React build are not. **8 GB disk minimum**, 2 vCPU, 2 GB RAM is comfortable.

```bash
pct create 200 \
  local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst \
  --hostname design-workshop \
  --cores 2 \
  --memory 2048 \
  --swap 1024 \
  --rootfs local-lvm:16 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp \
  --unprivileged 1 \
  --features nesting=1,keyctl=1 \
  --onboot 1 \
  --ostype debian \
  --password
```

`nesting=1` and `keyctl=1` are the magic words that make Docker run inside an unprivileged LXC. Without them you'll see opaque "operation not permitted" errors at `docker run`.

Start it:

```bash
pct start 200
pct exec 200 -- ip a   # verify it got a DHCP lease
```

If you'd rather use Proxmox's web UI: same options, just remember **Features → nesting + keyctl**.

> **Already have a docker host?** Skip ahead to [§3](#3-install-docker).

## 2. SSH into the container

From your workstation:

```bash
ssh root@<lxc-ip>
```

(If you didn't set a password during `pct create`, push your key in: `pct exec 200 -- mkdir -p /root/.ssh && pct push 200 ~/.ssh/id_ed25519.pub /root/.ssh/authorized_keys`.)

Once inside, install the basics:

```bash
apt update
apt install -y curl ca-certificates gnupg git ufw
```

(Optional, sane firewall — skip if your Proxmox host already firewalls the LXC.)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 8080/tcp           # the docker stack's published port
ufw --force enable
```

## 3. Install Docker

Docker's official Debian repository — pin version is irrelevant, just the latest stable:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Sanity check:

```bash
docker version
docker compose version       # should print v2.x
docker run --rm hello-world  # confirms the daemon runs in this LXC
```

If `hello-world` fails with a permission / cgroup error, your LXC is missing `nesting=1,keyctl=1`. Stop the container, fix it from the Proxmox host (`pct set 200 --features nesting=1,keyctl=1`), start it back up.

## 4. Clone the repo

```bash
cd /opt
git clone https://github.com/<your-username>/<your-repo>.git design-workshop
cd design-workshop
```

If your repo is private, add a deploy key:

```bash
ssh-keygen -t ed25519 -f /root/.ssh/id_dw -N ""
cat /root/.ssh/id_dw.pub        # paste this into GitHub → repo → Settings → Deploy keys
git clone git@github.com:<you>/<repo>.git design-workshop
```

## 5. Configure the production env file

```bash
cp deploy/.env.example deploy/.env
```

Edit it with your values (`vi deploy/.env`):

```bash
PUBLIC_URL=https://designworkshop.zaibatsui.co.uk
PUBLIC_PORT=8080
DB_NAME=design_workshop
APP_NAME=modular-pages
GOOGLE_CLIENT_ID=<your existing client id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your existing client secret>
OAUTH_STATE_SECRET=<paste output of: openssl rand -hex 32>
```

Generate a fresh state secret on the spot:

```bash
echo "OAUTH_STATE_SECRET=$(openssl rand -hex 32)" >> deploy/.env
# then go remove the placeholder line you replaced
```

Verify nothing's missing:

```bash
grep -E '^[A-Z_]+=' deploy/.env
```

## 6. Add the production redirect URI to your Google OAuth client

In another tab — **Google Cloud Console → APIs & Services → Credentials → your existing OAuth 2.0 Client ID → Authorized redirect URIs**, click **Add URI** and paste:

```
https://designworkshop.zaibatsui.co.uk/api/auth/google/callback
```

Hit **Save**. Leave the existing preview URI alone — you can keep both.

## 7. Build and start the stack

```bash
docker compose --env-file deploy/.env up -d --build
```

First build takes 5–10 minutes (the Playwright Python image is ~1.6 GB and the React build is ~3 GB of node_modules to chew through). Subsequent builds are seconds.

Watch the logs until "Application startup complete":

```bash
docker compose logs -f backend
```

You should see:

```
storage - INFO - Storage backend: local (UPLOADS_DIR=/var/uploads)
server  - INFO - Storage initialized
INFO:     Application startup complete.
```

Quick health check from the LXC itself:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/                # 200 (frontend)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/             # 200 (backend through nginx)
```

From your workstation (with the LXC's IP):

```bash
curl -i http://<lxc-ip>:8080/api/auth/me        # expect 401 (no session) — proves the route is alive
```

## 8. Wire up your reverse proxy

You need to terminate TLS for `designworkshop.zaibatsui.co.uk` and forward to `http://<lxc-ip>:8080` while passing `X-Forwarded-Proto` and `X-Forwarded-Host`.

Pick whichever you already run.

### 9. Reverse-proxy snippets

#### Caddy (the cheat code)

```caddyfile
designworkshop.zaibatsui.co.uk {
    reverse_proxy <lxc-ip>:8080 {
        header_up X-Forwarded-Proto https
        header_up X-Forwarded-Host  {host}
    }
}
```

Caddy provisions the LE cert automatically. Reload (`systemctl reload caddy`).

#### Nginx (manual)

```nginx
server {
    listen 443 ssl http2;
    server_name designworkshop.zaibatsui.co.uk;

    ssl_certificate     /etc/letsencrypt/live/designworkshop.zaibatsui.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/designworkshop.zaibatsui.co.uk/privkey.pem;

    client_max_body_size 12M;

    location / {
        proxy_pass http://<lxc-ip>:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host  $host;
    }
}
server {
    listen 80;
    server_name designworkshop.zaibatsui.co.uk;
    return 301 https://$host$request_uri;
}
```

`certbot --nginx -d designworkshop.zaibatsui.co.uk` to mint the cert.

#### Nginx Proxy Manager (UI)

1. **Hosts → Proxy Hosts → Add Proxy Host**
2. Domain Names: `designworkshop.zaibatsui.co.uk`
3. Forward Hostname/IP: `<lxc-ip>`
4. Forward Port: `8080`
5. **Custom Locations** → leave empty.
6. **SSL** tab: Request a new SSL certificate, force SSL, HTTP/2.
7. **Advanced** tab — paste:

   ```
   client_max_body_size 12M;
   proxy_set_header X-Forwarded-Proto https;
   proxy_set_header X-Forwarded-Host  $host;
   ```
8. Save. NPM does the cert dance for you.

#### Traefik (labels)

If you'd rather have Traefik discover the stack directly, add this to `frontend:` in `docker-compose.yml`:

```yaml
    labels:
      - traefik.enable=true
      - traefik.http.routers.dw.rule=Host(`designworkshop.zaibatsui.co.uk`)
      - traefik.http.routers.dw.entrypoints=websecure
      - traefik.http.routers.dw.tls.certresolver=le
      - traefik.http.services.dw.loadbalancer.server.port=80
```

… and remove the `ports:` block (Traefik takes over publishing).

## 10. Smoke test the live site

From your workstation:

```bash
curl -sI https://designworkshop.zaibatsui.co.uk/             # 200, served by nginx
curl -sI https://designworkshop.zaibatsui.co.uk/api/auth/me  # 401, served by uvicorn through nginx
```

Then in a real browser:

1. Open `https://designworkshop.zaibatsui.co.uk/login`.
2. Click **Sign in with Google**.
3. Land back on the dashboard, signed in, library empty.

If Google bounces you back with `redirect_uri_mismatch`: the URI you registered in step 6 doesn't match what the backend asked for. Most common cause: missing `X-Forwarded-Proto: https` from your reverse proxy → backend computes an `http://` callback. Double-check the headers your reverse proxy sets.

## 11. Migrate data from the preview environment (optional)

You only need this if you want to keep the sections and pages you've already built in the preview.

### 11a. Dump Mongo from the preview

In the preview environment's shell (e.g. the agent shell where this code originally ran):

```bash
cd /app/deploy/scripts
./export-mongo.sh /tmp/dw-dump.archive
```

Copy the archive to the Proxmox box:

```bash
# from your workstation, while the preview is still up:
emergent-cli download /tmp/dw-dump.archive ./dw-dump.archive   # or however you pull files
scp dw-dump.archive root@<lxc-ip>:/opt/design-workshop/
```

(If the preview shell exposes another file-export route, use that instead.)

### 11b. Restore into the new stack

On the Proxmox LXC:

```bash
cd /opt/design-workshop
./deploy/scripts/import-mongo.sh ./dw-dump.archive
```

The script copies the archive into the running mongo container, restores it into `${DB_NAME}`, and renames `test_database` → `${DB_NAME}` automatically.

### 11c. Mirror the uploaded image binaries

While the preview is **still up** (its Emergent storage is the source-of-truth for the binary files), run inside the new backend container:

```bash
docker compose exec backend \
  python /app/deploy/scripts/migrate-uploads.py \
    --source https://snippet-builder-2.preview.emergentagent.com \
    --target https://designworkshop.zaibatsui.co.uk
```

Add `--dry-run` to see what would change first.

The script walks every section / page / template config, finds image URLs that point at `<source>/api/files/<path>`, downloads each via HTTP, writes the bytes into `/var/uploads/<path>` in the new compose volume, and rewrites the URL in MongoDB to point at `<target>` instead. It's idempotent — re-running just verifies what's already on disk.

## 12. Day-2 ops

```bash
# Stack status
docker compose ps

# Tail logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mongo

# Restart one service after .env change
docker compose --env-file deploy/.env up -d backend

# Pick up new code from main
git pull
docker compose --env-file deploy/.env up -d --build

# Open a mongo shell
docker compose exec mongo mongo $(grep ^DB_NAME deploy/.env | cut -d= -f2)

# Backup mongo manually
./deploy/scripts/export-mongo.sh /backups/dw-$(date +%F).archive

# Backup uploads volume
docker run --rm \
  -v design-workshop_uploads-data:/src \
  -v /backups:/dst \
  alpine tar czf /dst/uploads-$(date +%F).tgz -C /src .

# Stop everything
docker compose down

# Stop + DELETE all data (mongo + uploads). Don't run this carelessly.
docker compose down -v
```

### Auto-update on push (optional)

If you want the LXC to auto-rebuild when you push to `main`, drop a cron entry on the LXC:

```bash
cat > /usr/local/bin/dw-update << 'EOF'
#!/bin/bash
set -euo pipefail
cd /opt/design-workshop
git fetch origin main
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ "$LOCAL" != "$REMOTE" ]; then
  git pull --ff-only origin main
  docker compose --env-file deploy/.env up -d --build
fi
EOF
chmod +x /usr/local/bin/dw-update

(crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/dw-update >>/var/log/dw-update.log 2>&1") | crontab -
```

(Or just `git pull && docker compose up -d --build` by hand whenever you ship new code.)

## 13. Troubleshooting

| Symptom | What to check |
|---|---|
| `redirect_uri_mismatch` on Google login | Reverse proxy isn't sending `X-Forwarded-Proto: https`. Add it. |
| Login works but the dashboard is empty after a "successful" sign-in | Browser blocked the `session_token` cookie. Make sure your reverse proxy is HTTPS — the cookie is `Secure;` and a plain-HTTP host won't get it. |
| Backend 502 from nginx | `docker compose logs backend` — most often a missing env var. The backend logs `RuntimeError` early on startup if so. |
| Image uploads succeed but `/api/files/...` 404s | UPLOADS_DIR didn't get created or the volume isn't mounted. `docker compose exec backend ls -la /var/uploads` — should show your namespace dir (`modular-pages/uploads/`). |
| Logo Strip / Hero render but show broken images | The image URLs in MongoDB still point at the preview hostname. Re-run `migrate-uploads.py` (it both downloads files and rewrites URLs). |
| `docker run hello-world` fails inside the LXC | LXC is missing `nesting=1,keyctl=1`. Fix from the Proxmox host: `pct set <id> --features nesting=1,keyctl=1` and reboot the container. |
| Mongo crashes immediately on start with "Illegal instruction" | Your CPU is even older than AVX-less Xeons; Mongo 4.4 needs SSE 4.2. There's no Mongo build below 4.4 we'd recommend running in 2026 — consider a bigger box. |
| Can't reach the LXC from your workstation | Proxmox host firewall or LXC's own UFW. `pct exec <id> -- ufw status` and `iptables -L -n` on the host. |

## 14. What's not in this stack (and what you can add)

- **TLS termination** — already handled by your reverse proxy. Don't bake certbot into the container.
- **MongoDB auth** — single-tenant, internal-network-only, not strictly required. Add a `MONGO_INITDB_ROOT_*` set in the compose file + a `--auth` arg on the mongo service if you want it.
- **External S3 / MinIO** — `backend/storage.py` is dual-mode now (local + Emergent). Add an `s3` branch to it later if you outgrow the local volume.
- **Healthchecks / restart-on-failure** — add `healthcheck:` blocks pointing at `/api/` (backend) and `/` (frontend) if you want compose to restart sick containers.
- **Automated nightly backups** — `cron` + `export-mongo.sh` + `tar` on the uploads volume gets you 95% of the way. Or add a `backup` service to the compose file with a `mongodump --archive` loop on a schedule.

You're done. Bookmark `https://designworkshop.zaibatsui.co.uk/guide` — that's the in-app reference.
