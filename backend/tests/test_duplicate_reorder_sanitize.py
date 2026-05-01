"""Backend tests for new endpoints in this iteration:
  - POST /api/sections/{id}/duplicate
  - POST /api/pages/{id}/duplicate (fresh block_ids + re-sanitized html)
  - PUT  /api/sections/reorder/bulk
  - PUT  /api/pages/reorder/bulk
  - Richtext bleach sanitization (POST /api/pages + PUT /api/pages/{id})
  - Auth regression (Google OAuth endpoints, /auth/me, /auth/logout, scraper, uploads GET)
"""
import asyncio
import os
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


def _fetch_session_token():
    async def _main():
        c = AsyncIOMotorClient(os.environ["MONGO_URL"])
        db = c[os.environ["DB_NAME"]]
        s = await db.user_sessions.find_one({}, sort=[("created_at", -1)])
        return s["session_token"] if s else None
    return asyncio.new_event_loop().run_until_complete(_main())


@pytest.fixture(scope="session")
def token():
    t = _fetch_session_token()
    if not t:
        pytest.skip("No session token")
    return t


@pytest.fixture(scope="session")
def client(token):
    s = requests.Session()
    s.headers.update({"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def unauth():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Auth / router mounting regression -------------------------------------
class TestAuthRegression:
    def test_root_api(self, unauth):
        r = unauth.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "message" in r.json()

    def test_auth_me_requires_auth(self, unauth):
        r = unauth.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_auth_me_with_token(self, client):
        r = client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        d = r.json()
        assert "email" in d and "user_id" in d

    def test_google_login_redirects(self, unauth):
        # Authlib issues a 302 to accounts.google.com
        r = unauth.get(f"{BASE_URL}/api/auth/google/login", allow_redirects=False)
        assert r.status_code in (302, 303, 307), r.status_code
        assert "google.com" in r.headers.get("location", "")

    def test_google_callback_route_mounted(self, unauth):
        # Without state/code Authlib errors out — we just want 4xx, not 404
        r = unauth.get(f"{BASE_URL}/api/auth/google/callback", allow_redirects=False)
        assert r.status_code != 404

    def test_logout_route_mounted(self, unauth):
        r = unauth.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code in (200, 401)

    def test_sections_gate(self, unauth):
        assert unauth.get(f"{BASE_URL}/api/sections").status_code == 401

    def test_pages_gate(self, unauth):
        assert unauth.get(f"{BASE_URL}/api/pages").status_code == 401


# --- Section duplicate + reorder --------------------------------------------
class TestSectionDuplicateReorder:
    ids = []

    def test_seed_three_sections(self, client):
        TestSectionDuplicateReorder.ids = []
        for i in range(3):
            r = client.post(
                f"{BASE_URL}/api/sections",
                json={"name": f"TEST_dup_sec_{i}", "type": "hero", "config": {"title": f"t{i}"}},
            )
            assert r.status_code == 200, r.text
            TestSectionDuplicateReorder.ids.append(r.json()["section_id"])
        assert len(TestSectionDuplicateReorder.ids) == 3

    def test_duplicate_section(self, client):
        src_id = TestSectionDuplicateReorder.ids[0]
        orig = client.get(f"{BASE_URL}/api/sections/{src_id}").json()
        r = client.post(f"{BASE_URL}/api/sections/{src_id}/duplicate")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["section_id"].startswith("sec_")
        assert d["section_id"] != src_id
        assert d["name"] == f"Copy of {orig['name']}"
        assert d["type"] == orig["type"]
        assert d["config"] == orig["config"]
        # New dup should sit at top of the grid
        listing = client.get(f"{BASE_URL}/api/sections").json()
        positions = {s["section_id"]: s.get("position", 0) for s in listing}
        assert positions[d["section_id"]] <= min(positions.values())
        TestSectionDuplicateReorder.ids.append(d["section_id"])

    def test_duplicate_unknown_404(self, client):
        r = client.post(f"{BASE_URL}/api/sections/sec_doesnotexist/duplicate")
        assert r.status_code == 404

    def test_reorder_bulk(self, client):
        reversed_ids = list(reversed(TestSectionDuplicateReorder.ids))
        r = client.put(
            f"{BASE_URL}/api/sections/reorder/bulk",
            json={"section_ids": reversed_ids},
        )
        assert r.status_code == 200, r.text
        lst = r.json()
        pos = {s["section_id"]: s["position"] for s in lst}
        for idx, sid in enumerate(reversed_ids):
            assert pos[sid] == idx, f"expected {sid} at position {idx}, got {pos[sid]}"
        # Persisted — re-list and confirm
        again = client.get(f"{BASE_URL}/api/sections").json()
        # Filter to just our ids to avoid interference from other sections
        our = [s for s in again if s["section_id"] in reversed_ids]
        our.sort(key=lambda s: s["position"])
        assert [s["section_id"] for s in our] == reversed_ids

    def test_cleanup_sections(self, client):
        for sid in TestSectionDuplicateReorder.ids:
            client.delete(f"{BASE_URL}/api/sections/{sid}")


# Sanitization tests removed in iteration 5 — the user explicitly reversed
# server-side bleach sanitization. See test_iter5_passthrough_names_templates.py
# for the new verbatim-passthrough assertions.


# --- Page duplicate + reorder ------------------------------------------------
class TestPageDuplicateReorder:
    ids = []

    def test_seed_pages(self, client):
        TestPageDuplicateReorder.ids = []
        # One with richtext + section blocks so we can test block_id regen
        for i in range(3):
            blocks = []
            if i == 0:
                blocks = [
                    {"type": "richtext", "config": {"html": "<p>dup test</p>"}},
                    {"type": "section", "section_type": "hero", "config": {"title": "H"}},
                ]
            r = client.post(
                f"{BASE_URL}/api/pages",
                json={"name": f"TEST_dup_pg_{i}", "blocks": blocks},
            )
            assert r.status_code == 200, r.text
            TestPageDuplicateReorder.ids.append(r.json()["page_id"])

    def test_duplicate_page_fresh_block_ids(self, client):
        src_pid = TestPageDuplicateReorder.ids[0]
        orig = client.get(f"{BASE_URL}/api/pages/{src_pid}").json()
        orig_block_ids = [b["block_id"] for b in orig["blocks"]]

        r = client.post(f"{BASE_URL}/api/pages/{src_pid}/duplicate")
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["page_id"].startswith("pg_")
        assert d["page_id"] != src_pid
        assert d["name"] == f"Copy of {orig['name']}"
        assert len(d["blocks"]) == len(orig["blocks"])

        new_block_ids = [b["block_id"] for b in d["blocks"]]
        # All fresh
        for nid in new_block_ids:
            assert nid.startswith("blk_")
            assert nid not in orig_block_ids
        # Richtext html preserved (and sanitized)
        rt_new = next(b for b in d["blocks"] if b["type"] == "richtext")
        rt_old = next(b for b in orig["blocks"] if b["type"] == "richtext")
        assert rt_new["config"]["html"] == rt_old["config"]["html"]

        TestPageDuplicateReorder.ids.append(d["page_id"])

    def test_duplicate_unknown_404(self, client):
        r = client.post(f"{BASE_URL}/api/pages/pg_doesnotexist/duplicate")
        assert r.status_code == 404

    def test_page_reorder_bulk(self, client):
        reversed_ids = list(reversed(TestPageDuplicateReorder.ids))
        r = client.put(
            f"{BASE_URL}/api/pages/reorder/bulk",
            json={"page_ids": reversed_ids},
        )
        assert r.status_code == 200, r.text
        pos = {p["page_id"]: p["position"] for p in r.json()}
        for idx, pid in enumerate(reversed_ids):
            assert pos[pid] == idx

        # Persisted
        again = client.get(f"{BASE_URL}/api/pages").json()
        our = [p for p in again if p["page_id"] in reversed_ids]
        our.sort(key=lambda p: p["position"])
        assert [p["page_id"] for p in our] == reversed_ids

    def test_cleanup_pages(self, client):
        for pid in TestPageDuplicateReorder.ids:
            client.delete(f"{BASE_URL}/api/pages/{pid}")


# --- Scraper + uploads regression --------------------------------------------
class TestScraperAndUploadsRegression:
    def test_scraper_endpoint_mounted(self, client):
        r = client.post(
            f"{BASE_URL}/api/scrape-product",
            json={"url": "https://example.com"},
            timeout=30,
        )
        # Endpoint should be mounted (not 404). It may return 200 with partial
        # data or 4xx/5xx depending on upstream — we only require it's routed.
        assert r.status_code != 404, r.text

    def test_files_endpoint_mounted(self, unauth):
        # Router is mounted; an unknown path returns a FileResponse error
        # (404/500 depending on impl) but must not be an ingress-level 502/503
        # and must not be gated by auth.
        r = unauth.get(f"{BASE_URL}/api/files/nonexistent.png")
        assert r.status_code in (404, 400, 500)
        assert r.status_code != 401  # public endpoint
