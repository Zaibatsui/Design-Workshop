# Backend image — FastAPI + Playwright (chromium fallback for the JS-rendered
# product scraper). The official Microsoft Playwright image ships with
# chromium and all OS deps preinstalled and version-pinned, so we don't need
# to run `playwright install` ourselves.
FROM mcr.microsoft.com/playwright/python:v1.59.0-jammy

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install Python deps first so the layer caches across code changes.
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

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
