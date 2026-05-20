"""FastAPI entrypoint — slim.

Only responsible for:
 - app + middleware stack (including the critical ForwardedHostMiddleware
   that normalizes scope.server/Host/scheme from X-Forwarded-Host/Proto so
   OAuth redirect_uri matches what Google saw),
 - OAuth state SessionMiddleware (required by Authlib),
 - including the individual routers.

All routes live in /app/backend/routers/*.
"""
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Must import AFTER load_dotenv so env-dependent modules pick up the values.
from routers import admin as admin_router  # noqa: E402
from routers import auth as auth_router  # noqa: E402
from routers import brand_kit as brand_kit_router  # noqa: E402
from routers import landing_demo as landing_demo_router  # noqa: E402
from routers import landing_spotlights as landing_spotlights_router  # noqa: E402
from routers import image_library as image_library_router  # noqa: E402
from routers import inline_image as inline_image_router  # noqa: E402
from routers import page_templates as page_templates_router  # noqa: E402
from routers import pages as pages_router  # noqa: E402
from routers import scraper as scraper_router  # noqa: E402
from routers import sections as sections_router  # noqa: E402
from routers import tickets as tickets_router  # noqa: E402
from routers import uploads as uploads_router  # noqa: E402
from storage import init_storage  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

OAUTH_STATE_SECRET = os.environ["OAUTH_STATE_SECRET"]

app = FastAPI()
api_router = APIRouter(prefix="/api")


class ForwardedHostMiddleware:
    """Pure-ASGI middleware that rewrites the ASGI scope's host/scheme from
    X-Forwarded-Host / X-Forwarded-Proto set by the Kubernetes ingress +
    Cloudflare. Without this, request.url_for() returns the internal cluster
    hostname (e.g. *.emergentcf.cloud), which gets encoded into Authlib's
    session-stored redirect_uri. Cloudflare rewrites the Location header to
    the external hostname before forwarding to the user, so Google stores the
    EXTERNAL redirect_uri. At token-exchange time Authlib replays the
    INTERNAL one from the session -> redirect_uri_mismatch.

    Must run OUTERMOST so every other middleware (Session, Authlib, CORS) and
    route handler sees the corrected scope.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            headers = dict(scope.get("headers") or [])
            fwd_host = headers.get(b"x-forwarded-host")
            fwd_proto = headers.get(b"x-forwarded-proto")
            if fwd_host:
                host_str = fwd_host.decode("latin-1").split(",")[0].strip()
                if ":" in host_str:
                    host, port_str = host_str.rsplit(":", 1)
                    try:
                        port = int(port_str)
                    except ValueError:
                        host, port = host_str, None
                else:
                    host = host_str
                    port = 443 if (fwd_proto == b"https") else 80
                scope["server"] = (host, port)
                new_headers = []
                for k, v in scope["headers"]:
                    if k == b"host":
                        new_headers.append((b"host", host_str.encode("latin-1")))
                    else:
                        new_headers.append((k, v))
                scope["headers"] = new_headers
            if fwd_proto:
                scope["scheme"] = fwd_proto.decode("latin-1").split(",")[0].strip()
        await self.app(scope, receive, send)


@app.on_event("startup")
async def _startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")


@api_router.get("/")
async def root():
    return {"message": "Modular Pages API"}


api_router.include_router(auth_router.router)
api_router.include_router(sections_router.router)
api_router.include_router(pages_router.router)
api_router.include_router(page_templates_router.router)
api_router.include_router(uploads_router.router)
api_router.include_router(scraper_router.router)
api_router.include_router(brand_kit_router.router)
api_router.include_router(landing_demo_router.admin_router)
api_router.include_router(landing_demo_router.public_router)
api_router.include_router(landing_spotlights_router.admin_router)
api_router.include_router(landing_spotlights_router.public_router)
api_router.include_router(image_library_router.router)
api_router.include_router(inline_image_router.router)
api_router.include_router(admin_router.router)
api_router.include_router(tickets_router.router)

app.include_router(api_router)

# SessionMiddleware is required by Authlib to track OAuth state across the
# Google redirect dance. Uses a separate signed cookie ("session") that's
# only read during /api/auth/google/* — our app session is a separate
# "session_token" cookie tied to user_sessions in MongoDB.
app.add_middleware(
    SessionMiddleware,
    secret_key=OAUTH_STATE_SECRET,
    same_site="lax",
    https_only=True,
    max_age=600,
)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# OUTERMOST — see class docstring above.
app.add_middleware(ForwardedHostMiddleware)
