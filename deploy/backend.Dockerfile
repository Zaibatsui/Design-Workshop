# Backend image — FastAPI + Playwright (chromium fallback for the JS-rendered
# product scraper). The official Microsoft Playwright image ships with
# chromium and all OS deps preinstalled and version-pinned, so the
# `playwright install` call below is purely defense-in-depth: it's a no-op
# when versions align, but it gives us a clean error (and auto-recovery)
# if `requirements.txt` ever drifts past the base image tag, or if the
# image is rebuilt against a slightly mismatched arch where one of
# chromium's shared libs is missing.
FROM mcr.microsoft.com/playwright/python:v1.59.0-jammy

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install Python deps first so the layer caches across code changes.
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Belt-and-suspenders: ensure the chromium build that ships with the
# base image is exactly what the pip-installed `playwright` package
# expects, and that every required system library is present. Skipped
# silently when versions already match — adds ~0s to a cache-warm
# build, ~30-60s on a cold one.
RUN python -m playwright install --with-deps chromium

# App code.
COPY backend/ /app/

# UPLOADS_DIR is mounted as a volume in compose; create it here too so a
# bare `docker run` still works.
RUN mkdir -p /var/uploads
ENV UPLOADS_DIR=/var/uploads

EXPOSE 8001

# --proxy-headers tells uvicorn to honour X-Forwarded-* from our nginx
# fronting service; combined with the in-app ForwardedHostMiddleware it
# makes OAuth callback URLs resolve to the public hostname.
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--proxy-headers", "--forwarded-allow-ips", "*"]
