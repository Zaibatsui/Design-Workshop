"""Backend tests for Hybrid Page Builder (Pages CRUD + Sections regression).

Runs against the public REACT_APP_BACKEND_URL. Uses a pre-minted session
token pulled from MongoDB (latest user_sessions doc) as a Bearer token.
"""
import os
import asyncio
import pytest
import requests
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path

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
def unauth_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- Auth gate ---
class TestAuthGate:
    def test_pages_requires_auth(self, unauth_client):
        r = unauth_client.get(f"{BASE_URL}/api/pages")
        assert r.status_code == 401

    def test_sections_requires_auth(self, unauth_client):
        r = unauth_client.get(f"{BASE_URL}/api/sections")
        assert r.status_code == 401


# --- Pages CRUD ---
class TestPagesCRUD:
    created_page_id = None

    def test_list_pages_authed(self, client):
        r = client.get(f"{BASE_URL}/api/pages")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_page(self, client):
        r = client.post(f"{BASE_URL}/api/pages", json={"name": "TEST_page_one", "blocks": []})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_page_one"
        assert data["blocks"] == []
        assert "page_id" in data and data["page_id"].startswith("pg_")
        assert "user_id" in data
        assert "created_at" in data and "updated_at" in data
        assert "_id" not in data
        TestPagesCRUD.created_page_id = data["page_id"]

    def test_get_created_page(self, client):
        pid = TestPagesCRUD.created_page_id
        assert pid
        r = client.get(f"{BASE_URL}/api/pages/{pid}")
        assert r.status_code == 200
        d = r.json()
        assert d["page_id"] == pid
        assert d["name"] == "TEST_page_one"
        assert "_id" not in d

    def test_get_unknown_page_404(self, client):
        r = client.get(f"{BASE_URL}/api/pages/pg_doesnotexist123")
        assert r.status_code == 404

    def test_update_page_normalizes_blocks(self, client):
        pid = TestPagesCRUD.created_page_id
        payload = {
            "name": "TEST_page_one_renamed",
            "blocks": [
                {"type": "section", "section_type": "hero", "config": {"title": "Hi"}},
                {"block_id": "blk_keepme0000", "type": "richtext",
                 "config": {"html": "<p>Hello</p>"}},
            ],
        }
        r = client.put(f"{BASE_URL}/api/pages/{pid}", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["name"] == "TEST_page_one_renamed"
        assert len(d["blocks"]) == 2
        b0, b1 = d["blocks"]
        assert b0.get("block_id")
        assert b0["block_id"].startswith("blk_")
        assert b0["type"] == "section"
        assert b0["section_type"] == "hero"
        assert b0["config"] == {"title": "Hi"}
        assert b1["block_id"] == "blk_keepme0000"
        assert b1["type"] == "richtext"
        assert b1["config"]["html"] == "<p>Hello</p>"
        assert "_id" not in d

    def test_updated_at_changes(self, client):
        pid = TestPagesCRUD.created_page_id
        r1 = client.get(f"{BASE_URL}/api/pages/{pid}")
        first_updated = r1.json()["updated_at"]
        import time
        time.sleep(1.1)
        r2 = client.put(f"{BASE_URL}/api/pages/{pid}", json={"name": "TEST_page_one_final"})
        second_updated = r2.json()["updated_at"]
        assert second_updated != first_updated

    def test_list_no_leaked_id(self, client):
        r = client.get(f"{BASE_URL}/api/pages")
        for p in r.json():
            assert "_id" not in p

    def test_delete_page(self, client):
        pid = TestPagesCRUD.created_page_id
        r = client.delete(f"{BASE_URL}/api/pages/{pid}")
        assert r.status_code == 200
        r2 = client.get(f"{BASE_URL}/api/pages/{pid}")
        assert r2.status_code == 404

    def test_delete_unknown_404(self, client):
        r = client.delete(f"{BASE_URL}/api/pages/pg_nonexistent0000")
        assert r.status_code == 404


# --- Sections regression ---
class TestSectionsRegression:
    created_section_id = None

    def test_list_sections(self, client):
        r = client.get(f"{BASE_URL}/api/sections")
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        for s in r.json():
            assert "_id" not in s

    def test_create_section(self, client):
        r = client.post(
            f"{BASE_URL}/api/sections",
            json={"name": "TEST_sec", "type": "hero", "config": {"title": "x"}},
        )
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "TEST_sec"
        assert d["type"] == "hero"
        assert d["config"] == {"title": "x"}
        assert d["section_id"].startswith("sec_")
        assert "_id" not in d
        TestSectionsRegression.created_section_id = d["section_id"]

    def test_update_section(self, client):
        sid = TestSectionsRegression.created_section_id
        r = client.put(
            f"{BASE_URL}/api/sections/{sid}",
            json={"name": "TEST_sec_renamed"},
        )
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_sec_renamed"

    def test_get_section(self, client):
        sid = TestSectionsRegression.created_section_id
        r = client.get(f"{BASE_URL}/api/sections/{sid}")
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_sec_renamed"

    def test_delete_section(self, client):
        sid = TestSectionsRegression.created_section_id
        r = client.delete(f"{BASE_URL}/api/sections/{sid}")
        assert r.status_code == 200
        r2 = client.get(f"{BASE_URL}/api/sections/{sid}")
        assert r2.status_code == 404


class TestCrossUserIsolation:
    def test_other_user_page_404(self, client):
        r = client.get(f"{BASE_URL}/api/pages/pg_otheruser00000")
        assert r.status_code == 404
