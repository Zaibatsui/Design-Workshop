"""Iter6: BlockIn pydantic tightening.

Validator rules in /app/backend/routers/pages.py:
  - type must be in {"section","richtext"}
  - if type=="section" → section_type required
  - if type=="richtext" → section_type must be None
  - type is required (pydantic field)

Also regress duplicate / reorder / page-templates with valid shapes only.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
TOKEN = "jqzWBjeEXiyy_fLwnz_cYnCHeiT9hjNEIx2yazaqZ9abuSXIhiMaKxbub-WrKGzw"
H = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


@pytest.fixture
def created_pages():
    ids = []
    yield ids
    for pid in ids:
        try:
            requests.delete(f"{BASE_URL}/api/pages/{pid}", headers=H, timeout=15)
        except Exception:
            pass


@pytest.fixture
def created_templates():
    ids = []
    yield ids
    for tid in ids:
        try:
            requests.delete(f"{BASE_URL}/api/page-templates/{tid}", headers=H, timeout=15)
        except Exception:
            pass


# ---------- BlockIn 422s ----------

class TestBlockValidator422:
    def test_unknown_type_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={"name": "TEST_iter6_bad_type", "blocks": [{"type": "banana"}]},
            timeout=20,
        )
        assert r.status_code == 422, r.text
        assert "banana" in r.text or "Invalid block type" in r.text

    def test_section_without_section_type_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={
                "name": "TEST_iter6_section_missing_st",
                "blocks": [{"type": "section", "config": {}}],
            },
            timeout=20,
        )
        assert r.status_code == 422, r.text
        assert "section_type" in r.text

    def test_richtext_with_section_type_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={
                "name": "TEST_iter6_richtext_with_st",
                "blocks": [
                    {
                        "type": "richtext",
                        "section_type": "hero",
                        "config": {"html": "<p>x</p>"},
                    }
                ],
            },
            timeout=20,
        )
        assert r.status_code == 422, r.text
        assert "richtext" in r.text and "section_type" in r.text

    def test_block_missing_type_field_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={
                "name": "TEST_iter6_missing_type",
                "blocks": [{"section_type": "hero", "config": {}}],
            },
            timeout=20,
        )
        assert r.status_code == 422, r.text

    def test_put_pages_validates_blocks(self, created_pages):
        # First create a valid page
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={"name": "TEST_iter6_put_validate", "blocks": []},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        pid = r.json()["page_id"]
        created_pages.append(pid)

        r2 = requests.put(
            f"{BASE_URL}/api/pages/{pid}",
            headers=H,
            json={"blocks": [{"type": "banana"}]},
            timeout=20,
        )
        assert r2.status_code == 422, r2.text


# ---------- BlockIn happy path ----------

class TestBlockValidator200:
    def test_section_with_hero_succeeds(self, created_pages):
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={
                "name": "TEST_iter6_section_ok",
                "blocks": [
                    {"type": "section", "section_type": "hero", "config": {}}
                ],
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        created_pages.append(body["page_id"])
        assert len(body["blocks"]) == 1
        assert body["blocks"][0]["type"] == "section"
        assert body["blocks"][0]["section_type"] == "hero"

    def test_richtext_empty_html_succeeds(self, created_pages):
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={
                "name": "TEST_iter6_rt_ok",
                "blocks": [{"type": "richtext", "config": {"html": ""}}],
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        created_pages.append(body["page_id"])
        assert body["blocks"][0]["type"] == "richtext"
        assert body["blocks"][0]["section_type"] is None
        assert body["blocks"][0]["config"]["html"] == ""


# ---------- Regression: CRUD + duplicate + reorder ----------

class TestPagesRegression:
    def test_full_crud_duplicate_reorder(self, created_pages):
        # Create with mixed valid blocks
        r = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={
                "name": "TEST_iter6_regression_a",
                "blocks": [
                    {"type": "section", "section_type": "hero", "config": {"title": "Hi"}},
                    {"type": "richtext", "config": {"html": "<p>hello</p>"}},
                ],
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text
        a = r.json()
        created_pages.append(a["page_id"])
        assert len(a["blocks"]) == 2

        # GET
        rg = requests.get(f"{BASE_URL}/api/pages/{a['page_id']}", headers=H, timeout=15)
        assert rg.status_code == 200
        assert rg.json()["name"] == "TEST_iter6_regression_a"

        # PUT update name + blocks
        rp = requests.put(
            f"{BASE_URL}/api/pages/{a['page_id']}",
            headers=H,
            json={
                "name": "TEST_iter6_regression_a_renamed",
                "blocks": [{"type": "richtext", "config": {"html": "<b>x</b>"}}],
            },
            timeout=20,
        )
        assert rp.status_code == 200, rp.text
        assert rp.json()["name"] == "TEST_iter6_regression_a_renamed"
        assert len(rp.json()["blocks"]) == 1

        # Duplicate
        rd = requests.post(
            f"{BASE_URL}/api/pages/{a['page_id']}/duplicate", headers=H, timeout=20
        )
        assert rd.status_code == 200, rd.text
        dup = rd.json()
        created_pages.append(dup["page_id"])
        assert dup["name"].startswith("Copy of ")
        assert dup["page_id"] != a["page_id"]
        # block_ids should differ
        a_ids = {b["block_id"] for b in rp.json()["blocks"]}
        d_ids = {b["block_id"] for b in dup["blocks"]}
        assert a_ids.isdisjoint(d_ids)

        # Create another page
        r2 = requests.post(
            f"{BASE_URL}/api/pages",
            headers=H,
            json={"name": "TEST_iter6_regression_b", "blocks": []},
            timeout=20,
        )
        assert r2.status_code == 200
        b = r2.json()
        created_pages.append(b["page_id"])

        # Reorder bulk
        rr = requests.put(
            f"{BASE_URL}/api/pages/reorder/bulk",
            headers=H,
            json={"page_ids": [b["page_id"], a["page_id"], dup["page_id"]]},
            timeout=20,
        )
        assert rr.status_code == 200, rr.text
        rolled = rr.json()
        # Positions of our three should match the input order among themselves
        pos = {p["page_id"]: p["position"] for p in rolled}
        assert pos[b["page_id"]] < pos[a["page_id"]] < pos[dup["page_id"]]

    def test_list_pages_ok(self):
        r = requests.get(f"{BASE_URL}/api/pages", headers=H, timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- /api/page-templates uses the same validator ----------

class TestPageTemplatesValidator:
    def test_template_valid_blocks_succeed(self, created_templates):
        r = requests.post(
            f"{BASE_URL}/api/page-templates",
            headers=H,
            json={
                "name": "TEST_iter6_tpl_ok",
                "blocks": [
                    {"type": "section", "section_type": "hero", "config": {}},
                    {"type": "richtext", "config": {"html": "<p>tpl</p>"}},
                ],
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text
        tpl = r.json()
        created_templates.append(tpl["template_id"])
        assert tpl["template_id"].startswith("tpl_")
        assert len(tpl["blocks"]) == 2

    def test_template_invalid_block_type_rejected(self):
        r = requests.post(
            f"{BASE_URL}/api/page-templates",
            headers=H,
            json={
                "name": "TEST_iter6_tpl_bad",
                "blocks": [{"type": "banana"}],
            },
            timeout=20,
        )
        assert r.status_code == 422, r.text


# ---------- Other routers unchanged ----------

class TestOtherRoutersUnchanged:
    def test_sections_auth_gate(self):
        r = requests.get(f"{BASE_URL}/api/sections", timeout=15)
        assert r.status_code in (401, 403), r.text

    def test_auth_me(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=H, timeout=15)
        assert r.status_code == 200, r.text
        assert "email" in r.json() or "user_id" in r.json()

    def test_scrape_product_reachable(self):
        # /api/scrape-product is currently public (legacy behavior);
        # we just verify the router is mounted and responding.
        r = requests.post(
            f"{BASE_URL}/api/scrape-product",
            json={"url": "https://example.com"},
            timeout=20,
        )
        assert r.status_code in (200, 401, 403, 422), r.text

    def test_upload_auth_gate(self):
        r = requests.post(f"{BASE_URL}/api/upload", timeout=15)
        assert r.status_code in (401, 403, 422), r.text
