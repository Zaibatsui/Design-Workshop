"""Backend tests for Modular Pages API — upload + public file proxy."""
import io
import os
import struct
import zlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://modular-pages-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _make_png_bytes():
    # minimal 1x1 PNG
    sig = b"\x89PNG\r\n\x1a\n"
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0)
    raw = b"\x00\xff\x00\x00"
    idat = zlib.compress(raw)
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    return s


# Basic health
def test_root_returns_modular_pages_message(client):
    r = client.get(f"{API}/")
    assert r.status_code == 200
    data = r.json()
    assert "message" in data
    assert "Modular Pages" in data["message"]


# Upload: accepts PNG, returns required fields
@pytest.fixture(scope="module")
def uploaded(client):
    png = _make_png_bytes()
    files = {"file": ("TEST_hero.png", io.BytesIO(png), "image/png")}
    r = client.post(f"{API}/upload", files=files)
    assert r.status_code == 200, f"upload failed: {r.status_code} {r.text}"
    data = r.json()
    for k in ("path", "url", "size", "content_type"):
        assert k in data, f"missing key {k} in {data}"
    assert data["content_type"] == "image/png"
    assert data["size"] > 0
    assert data["url"].startswith("/api/files/")
    return data, png


def test_upload_png_returns_expected_shape(uploaded):
    data, png = uploaded
    assert isinstance(data["path"], str) and len(data["path"]) > 0


# Public file proxy: returns bytes and correct Content-Type without auth
def test_files_endpoint_returns_bytes_publicly(client, uploaded):
    data, png = uploaded
    url = f"{BASE_URL}{data['url']}"
    r = requests.get(url)  # fresh session — no auth/cookies
    assert r.status_code == 200, f"expected 200, got {r.status_code}"
    assert r.headers.get("Content-Type", "").startswith("image/png")
    assert r.content[:8] == b"\x89PNG\r\n\x1a\n"


# Upload rejects unsupported file types
def test_upload_rejects_txt(client):
    files = {"file": ("TEST_bad.txt", io.BytesIO(b"hello"), "text/plain")}
    r = client.post(f"{API}/upload", files=files)
    assert r.status_code == 400
    body = r.json()
    assert "detail" in body
