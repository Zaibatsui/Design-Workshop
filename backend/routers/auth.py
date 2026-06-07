"""Auth router — Direct Google OAuth via Authlib.

REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS,
THIS BREAKS THE AUTH
"""
import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from db import db
from deps import SESSION_COOKIE, SESSION_TTL_DAYS, SESSION_IDLE_MINUTES, SESSION_IDLE_MIN, SESSION_IDLE_MAX, User, get_current_user

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]

router = APIRouter(prefix="/auth", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@router.get("/google/login")
async def google_login(request: Request):
    # ForwardedHostMiddleware (registered in server.py) honors X-Forwarded-Host
    # and X-Forwarded-Proto from the Kubernetes ingress, so request.url_for()
    # produces an https:// URL on the external hostname that matches the
    # Authorized redirect URI registered in Google Cloud Console.
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        logger.warning("Google OAuth failed: %s", e)
        return RedirectResponse(url="/login?error=oauth_failed", status_code=302)

    userinfo = token.get("userinfo") or token.get("id_token_claims") or {}
    email = userinfo.get("email")
    name = userinfo.get("name") or email
    picture = userinfo.get("picture")
    if not email:
        return RedirectResponse(url="/login?error=no_email", status_code=302)

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc)
    if existing:
        # Reject deactivated accounts at the OAuth step itself — clearer
        # than letting the session create and then 403-ing the next API
        # call. The error code surfaces in the /login URL so the SPA can
        # show a tailored message.
        if not existing.get("is_active", True):
            return RedirectResponse(url="/login?error=account_deactivated", status_code=302)
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "last_login_at": now}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": now,
            "last_login_at": now,
            "is_active": True,
        })

    session_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=SESSION_TTL_DAYS)
    idle_expires_at = now + timedelta(minutes=SESSION_IDLE_MINUTES)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at,
        "idle_expires_at": idle_expires_at,
        "created_at": now,
    })

    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_token,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return response


@router.get("/me", response_model=User)
async def auth_me(current_user: User = Depends(get_current_user)):
    return current_user


class UIModeUpdate(BaseModel):
    ui_mode: str


class IdleMinutesUpdate(BaseModel):
    session_idle_minutes: int


@router.patch("/me/ui-mode", response_model=User)
async def update_ui_mode(
    payload: UIModeUpdate,
    current_user: User = Depends(get_current_user),
):
    """Switch between the Classic and Studio UI shells.

    Studio is the default for every user; Classic is an opt-out path.
    The choice is persisted on the user document so it sticks across
    sessions and browsers.
    """
    if payload.ui_mode not in ("classic", "studio"):
        raise HTTPException(
            status_code=400, detail="ui_mode must be 'classic' or 'studio'"
        )
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"ui_mode": payload.ui_mode}},
    )
    updated = await db.users.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    updated["is_admin"] = current_user.is_admin
    return User(**updated)


@router.post("/me/onboarded", response_model=User)
async def mark_onboarded(current_user: User = Depends(get_current_user)):
    """Flip the user's `onboarded` flag to True.

    Called by the frontend exactly once — when the user finishes (or
    explicitly skips) the first-login Studio walkthrough. Idempotent.
    """
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"onboarded": True}},
    )
    updated = await db.users.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    updated["is_admin"] = current_user.is_admin
    return User(**updated)


@router.patch("/me/idle-minutes", response_model=User)
async def update_idle_minutes(
    payload: IdleMinutesUpdate,
    current_user: User = Depends(get_current_user),
):
    """Lets the signed-in user choose their own idle-timeout window.

    Bounded to [SESSION_IDLE_MIN, SESSION_IDLE_MAX] (30–120 minutes)
    so a curious user can't push it indefinitely. The new value is
    persisted on the user document and picked up on the next
    authenticated request (no need to re-login).
    """
    n = int(payload.session_idle_minutes)
    if n < SESSION_IDLE_MIN or n > SESSION_IDLE_MAX:
        raise HTTPException(
            status_code=400,
            detail=f"session_idle_minutes must be between {SESSION_IDLE_MIN} and {SESSION_IDLE_MAX}",
        )
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"session_idle_minutes": n}},
    )
    updated = await db.users.find_one(
        {"user_id": current_user.user_id}, {"_id": 0}
    )
    updated["is_admin"] = current_user.is_admin
    return User(**updated)


@router.post("/logout")
async def auth_logout(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(SESSION_COOKIE, path="/", samesite="lax", secure=True)
    return {"ok": True}
