"""Iteration 5 backend tests:
  - Richtext HTML is NOT sanitized server-side (verbatim passthrough).
  - BlockIn has a `name` field (preserved through POST/PUT/duplicate).
  - /api/page-templates CRUD + auth gating + user scoping + block_id stripping.
  - Quick regression on sections/pages/auth/upload/scrape route mounting.
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
        pytest.skip("No session token available")
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


# Payload that must survive server round-trip VERBATIM (no bleach).
NASTY = (
    "<h1>Title</h1>"
    "<p>ok <strong>bold</strong> <em>italic</em> "
    "<a href='https://example.com'>link</a></p>"
    "<ul><li>a</li><li>b</li></ul>"
    "<script>alert('xss')</script>"
    "<p onmouseover='alert(1)'>hover</p>"
    "<iframe src='https://evil.com'></iframe>"
    "<a href='javascript:alert(1)'>bad</a>"
)


# --- Richtext passthrough (no sanitization) -------------------------------
class TestRichtextPassthrough:
    pid = None

    def test_create_page_preserves_verbatim(self, client):
        payload = {
            "name": "TEST_iter5_nasty",
            "blocks": [{"type": "richtext", "config": {"html": NASTY}}],
        }
        r = client.post(f"{BASE_URL}/api/pages", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        html = d["blocks"][0]["config"]["html"]
        assert html == NASTY, f"HTML was modified: {html!r}"
        # Explicit sanity checks: dangerous tokens should still be present
        lower = html.lower()
        assert "<script" in lower
        assert "<iframe" in lower
        assert "onmouseover" in lower
        assert "javascript:" in lower
        TestRichtextPassthrough.pid = d["page_id"]

    def test_get_round_trip_verbatim(self, client):
        r = client.get(f"{BASE_URL}/api/pages/{TestRichtextPassthrough.pid}")
        assert r.status_code == 200
        html = r.json()["blocks"][0]["config"]["html"]
        assert html == NASTY

    def test_put_page_preserves_verbatim(self, client):
        payload = {
            "blocks": [
                {"type": "richtext",
                 "config": {"html": "<p onclick='x()'>u</p><script>bad</script><b>k</b>"}},
            ],
        }
        r = client.put(f"{BASE_URL}/api/pages/{TestRichtextPassthrough.pid}", json=payload)
        assert r.status_code == 200, r.text
        html = r.json()["blocks"][0]["config"]["html"]
        assert html == "<p onclick='x()'>u</p><script>bad</script><b>k</b>"

    def test_cleanup(self, client):
        if TestRichtextPassthrough.pid:
            client.delete(f"{BASE_URL}/api/pages/{TestRichtextPassthrough.pid}")


# --- Block.name field --------------------------------------------------------
class TestBlockName:
    pid = None

    def test_create_page_with_named_blocks(self, client):
        payload = {
            "name": "TEST_iter5_named",
            "blocks": [
                {"name": "Hero Section", "type": "section",
                 "section_type": "hero", "config": {"title": "A"}},
                {"name": "Intro Copy", "type": "richtext",
                 "config": {"html": "<p>hi</p>"}},
                {"type": "section", "section_type": "hero", "config": {"title": "B"}},
            ],
        }
        r = client.post(f"{BASE_URL}/api/pages", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["blocks"][0]["name"] == "Hero Section"
        assert d["blocks"][1]["name"] == "Intro Copy"
        assert d["blocks"][2].get("name") is None
        TestBlockName.pid = d["page_id"]

    def test_get_preserves_names(self, client):
        r = client.get(f"{BASE_URL}/api/pages/{TestBlockName.pid}")
        assert r.status_code == 200
        blks = r.json()["blocks"]
        assert [b.get("name") for b in blks] == ["Hero Section", "Intro Copy", None]

    def test_put_updates_names(self, client):
        pid = TestBlockName.pid
        # Fetch first so we have block_ids
        current = client.get(f"{BASE_URL}/api/pages/{pid}").json()["blocks"]
        updated = [
            {**current[0], "name": "Hero (renamed)"},
            {**current[1], "name": None},
            {**current[2], "name": "Trailing"},
        ]
        r = client.put(f"{BASE_URL}/api/pages/{pid}", json={"blocks": updated})
        assert r.status_code == 200, r.text
        blks = r.json()["blocks"]
        assert [b.get("name") for b in blks] == ["Hero (renamed)", None, "Trailing"]

    def test_duplicate_preserves_names_and_html(self, client):
        pid = TestBlockName.pid
        # Add some nasty richtext so we also verify duplicate doesn't sanitize.
        cur = client.get(f"{BASE_URL}/api/pages/{pid}").json()["blocks"]
        cur[1]["config"] = {"html": NASTY}
        client.put(f"{BASE_URL}/api/pages/{pid}", json={"blocks": cur})

        r = client.post(f"{BASE_URL}/api/pages/{pid}/duplicate")
        assert r.status_code == 200, r.text
        dup = r.json()
        assert dup["page_id"] != pid
        assert [b.get("name") for b in dup["blocks"]] == ["Hero (renamed)", None, "Trailing"]
        # Fresh block_ids
        orig_ids = {b["block_id"] for b in cur}
        new_ids = {b["block_id"] for b in dup["blocks"]}
        assert orig_ids.isdisjoint(new_ids)
        # Richtext verbatim
        rt = next(b for b in dup["blocks"] if b["type"] == "richtext")
        assert rt["config"]["html"] == NASTY
        # Clean up the duplicate
        client.delete(f"{BASE_URL}/api/pages/{dup['page_id']}")

    def test_cleanup(self, client):
        if TestBlockName.pid:
            client.delete(f"{BASE_URL}/api/pages/{TestBlockName.pid}")


# --- Page templates ----------------------------------------------------------
class TestPageTemplates:
    tpl_id = None

    def test_requires_auth(self, unauth):
        assert unauth.get(f"{BASE_URL}/api/page-templates").status_code == 401

    def test_list_returns_list(self, client):
        r = client.get(f"{BASE_URL}/api/page-templates")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_template_strips_block_ids(self, client):
        payload = {
            "name": "TEST_iter5_tpl",
            "description": "A template",
            "blocks": [
                {"block_id": "blk_SHOULD_BE_STRIPPED",
                 "name": "Hero",
                 "type": "section",
                 "section_type": "hero",
                 "config": {"title": "Welcome"}},
                {"block_id": "blk_ALSO_STRIPPED",
                 "type": "richtext",
                 "config": {"html": "<script>keep me</script><p>ok</p>"}},
            ],
        }
        r = client.post(f"{BASE_URL}/api/page-templates", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["template_id"].startswith("tpl_"), d
        assert d["name"] == "TEST_iter5_tpl"
        assert d["description"] == "A template"
        assert "_id" not in d
        # block_id MUST be stripped
        for b in d["blocks"]:
            assert "block_id" not in b, f"block_id leaked: {b}"
        # But other fields preserved (including name & unsanitized html)
        assert d["blocks"][0]["name"] == "Hero"
        assert d["blocks"][0]["section_type"] == "hero"
        assert d["blocks"][0]["config"] == {"title": "Welcome"}
        assert d["blocks"][1]["config"]["html"] == "<script>keep me</script><p>ok</p>"
        TestPageTemplates.tpl_id = d["template_id"]

    def test_list_includes_created(self, client):
        r = client.get(f"{BASE_URL}/api/page-templates")
        assert r.status_code == 200
        ids = [t["template_id"] for t in r.json()]
        assert TestPageTemplates.tpl_id in ids
        for t in r.json():
            assert "_id" not in t
            for b in t.get("blocks", []):
                assert "block_id" not in b

    def test_delete_unknown_404(self, client):
        r = client.delete(f"{BASE_URL}/api/page-templates/tpl_does_not_exist")
        assert r.status_code == 404

    def test_user_scoping(self, client):
        # A fake/other template id should 404 (not expose existence)
        r = client.delete(f"{BASE_URL}/api/page-templates/tpl_otheruserabcd")
        assert r.status_code == 404

    def test_delete_success(self, client):
        r = client.delete(f"{BASE_URL}/api/page-templates/{TestPageTemplates.tpl_id}")
        assert r.status_code == 200
        # No longer in list
        r2 = client.get(f"{BASE_URL}/api/page-templates")
        ids = [t["template_id"] for t in r2.json()]
        assert TestPageTemplates.tpl_id not in ids
        # Second delete → 404
        r3 = client.delete(f"{BASE_URL}/api/page-templates/{TestPageTemplates.tpl_id}")
        assert r3.status_code == 404


# --- Route-mount regression --------------------------------------------------
class TestRouterMountRegression:
    def test_sections_gate(self, unauth):
        assert unauth.get(f"{BASE_URL}/api/sections").status_code == 401

    def test_pages_gate(self, unauth):
        assert unauth.get(f"{BASE_URL}/api/pages").status_code == 401

    def test_auth_me(self, client):
        r = client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert "email" in r.json()

    def test_scrape_endpoint_mounted(self, client):
        r = client.post(
            f"{BASE_URL}/api/scrape-product",
            json={"url": "https://example.com"},
            timeout=30,
        )
        assert r.status_code != 404

    def test_files_endpoint_mounted(self, unauth):
        r = unauth.get(f"{BASE_URL}/api/files/nonexistent.png")
        assert r.status_code in (400, 404, 500)
        assert r.status_code != 401
