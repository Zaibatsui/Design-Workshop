"""Brand Kit API tests + integration with section creation.

Covers:
 - GET /api/brand-kit auth gating + default shape
 - PUT /api/brand-kit persistence round-trip
 - Section creation accepts brand-kit-flavoured config
   (the overlay itself is FE-side, so we just confirm that whatever the
   FE posts is round-tripped via GET /api/sections/<id>).
"""
import os
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://section-forge-1.preview.emergentagent.com",
).rstrip("/")
TOKEN = "BhDNRIZaNl8EgFgndl8MywKImOdn8PUpyj0deIry1ZYl9fxJ1L0SKFMKYdS1BN_7"

DEFAULT_KIT = {
    "primary_color": "#E01839",
    "secondary_color": "#1f2937",
    "text_color": "#1f2937",
    "background_color": "#ffffff",
    "heading_font": "Poppins",
    "body_font": "Poppins",
}

CUSTOM_KIT = {
    "primary_color": "#ff5500",
    "secondary_color": "#0055ff",
    "text_color": "#222222",
    "background_color": "#fafafa",
    "heading_font": "Inter",
    "body_font": "Roboto",
}


@pytest.fixture(scope="module")
def auth():
    s = requests.Session()
    s.headers.update({
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    })
    # Sanity: auth works
    r = s.get(f"{BASE_URL}/api/brand-kit", timeout=10)
    if r.status_code != 200:
        pytest.skip(f"Auth token invalid (got {r.status_code}); aborting suite")
    return s


@pytest.fixture(scope="module", autouse=True)
def restore_kit_after(auth):
    """Save the user's current kit, run tests, then restore at module end."""
    original = auth.get(f"{BASE_URL}/api/brand-kit").json()
    yield
    auth.put(f"{BASE_URL}/api/brand-kit", json=original)


# --- Auth gating ---------------------------------------------------------

def test_get_brand_kit_requires_auth():
    r = requests.get(f"{BASE_URL}/api/brand-kit", timeout=10)
    assert r.status_code == 401


def test_put_brand_kit_requires_auth():
    r = requests.put(
        f"{BASE_URL}/api/brand-kit",
        json=CUSTOM_KIT,
        timeout=10,
    )
    assert r.status_code == 401


# --- Default shape -------------------------------------------------------

def test_default_kit_shape_after_reset(auth):
    """Reset kit to defaults, GET it, confirm shape + values."""
    r = auth.put(f"{BASE_URL}/api/brand-kit", json=DEFAULT_KIT)
    assert r.status_code == 200
    g = auth.get(f"{BASE_URL}/api/brand-kit")
    assert g.status_code == 200
    body = g.json()
    for k, v in DEFAULT_KIT.items():
        assert body.get(k) == v, f"{k}: expected {v}, got {body.get(k)}"


# --- Round-trip persistence ---------------------------------------------

def test_put_persists_and_get_returns(auth):
    r = auth.put(f"{BASE_URL}/api/brand-kit", json=CUSTOM_KIT)
    assert r.status_code == 200
    saved = r.json()
    assert saved == CUSTOM_KIT

    g = auth.get(f"{BASE_URL}/api/brand-kit")
    assert g.status_code == 200
    assert g.json() == CUSTOM_KIT


# --- Validation: bad payload --------------------------------------------

def test_put_rejects_extra_fields_or_keeps_known_only(auth):
    """Pydantic should silently drop unknowns OR validate types."""
    payload = {**CUSTOM_KIT, "logo_url": "should_be_ignored"}
    r = auth.put(f"{BASE_URL}/api/brand-kit", json=payload)
    assert r.status_code == 200
    out = r.json()
    assert "logo_url" not in out


# --- Section integration ------------------------------------------------

def test_section_create_round_trip_with_brand_colors(auth):
    """Create a 'content' section with brand-flavored config; confirm
    the GET round-trip preserves those exact field values.
    The FE applyBrandKit() puts headingColor/bodyColor/font/etc into
    config — backend stores whatever it's given."""
    auth.put(f"{BASE_URL}/api/brand-kit", json=CUSTOM_KIT)
    cfg = {
        "headingColor": CUSTOM_KIT["primary_color"],
        "bodyColor": CUSTOM_KIT["text_color"],
        "background": CUSTOM_KIT["background_color"],
        "primaryColor": CUSTOM_KIT["primary_color"],
        "font": CUSTOM_KIT["heading_font"],
        "uid": "TEST_brand_uid",
        "heading": "Brand test",
        "body": "Body",
    }
    r = auth.post(
        f"{BASE_URL}/api/sections",
        json={"name": "TEST_brand_content", "type": "content", "config": cfg},
    )
    assert r.status_code in (200, 201)
    created = r.json()
    sid = created["section_id"]
    try:
        g = auth.get(f"{BASE_URL}/api/sections/{sid}")
        assert g.status_code == 200
        got = g.json()
        for k, v in cfg.items():
            assert got["config"].get(k) == v, f"{k} mismatch: {got['config'].get(k)}"
    finally:
        auth.delete(f"{BASE_URL}/api/sections/{sid}")


def test_section_create_products_priceColor_persists(auth):
    auth.put(f"{BASE_URL}/api/brand-kit", json=CUSTOM_KIT)
    cfg = {
        "titleColor": CUSTOM_KIT["text_color"],
        "priceColor": CUSTOM_KIT["primary_color"],
        "hoverBorder": CUSTOM_KIT["primary_color"],
        "font": CUSTOM_KIT["heading_font"],
        "uid": "TEST_brand_prod",
        "products": [],
    }
    r = auth.post(
        f"{BASE_URL}/api/sections",
        json={"name": "TEST_brand_products", "type": "products", "config": cfg},
    )
    assert r.status_code in (200, 201)
    sid = r.json()["section_id"]
    try:
        g = auth.get(f"{BASE_URL}/api/sections/{sid}")
        assert g.json()["config"]["priceColor"] == CUSTOM_KIT["primary_color"]
        assert g.json()["config"]["font"] == CUSTOM_KIT["heading_font"]
    finally:
        auth.delete(f"{BASE_URL}/api/sections/{sid}")
