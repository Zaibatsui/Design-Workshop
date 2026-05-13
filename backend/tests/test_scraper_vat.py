"""Regression tests for the Nettailer VAT toggle in the scraper.

These tests verify the pure-Python helpers without hitting the network,
so they're safe to run in CI. The live end-to-end test is gated on the
``RUN_LIVE_NETTAILER_TEST=1`` environment variable.
"""
import os

import pytest

from routers.scraper import (
    _format_price,
    _is_nettailer,
    _origin,
    _parse_money,
)


def test_parse_money_handles_currency_formats():
    assert _parse_money("£1,684.60") == 1684.60
    assert _parse_money("£2,021.52") == 2021.52
    assert _parse_money("99") == 99.0
    assert _parse_money("") is None
    assert _parse_money(None) is None
    assert _parse_money("Out of stock") is None


def test_format_price_normalises_numeric_strings():
    assert _format_price("1684.60") == "£1684.60"
    assert _format_price("£1,684.60") == "£1,684.60"
    assert _format_price(None) is None


def test_is_nettailer_detects_host():
    assert _is_nettailer("https://demo.nettailer.com/product/x", "") is True
    assert _is_nettailer("https://store.netset.se/p/1", "") is True
    assert _is_nettailer("https://example.com/p", "") is False


def test_is_nettailer_detects_markup_fallback():
    html_with_switcher = '<div class="vat-switcher-label">Excl VAT</div>'
    assert _is_nettailer("https://acme.example/p", html_with_switcher) is True

    html_with_toggle = "<script>fetch('/nodeapi/change_inc_vat')</script>"
    assert _is_nettailer("https://acme.example/p", html_with_toggle) is True

    assert _is_nettailer("https://acme.example/p", "<div>plain</div>") is False


def test_origin_strips_path_and_query():
    assert _origin("https://demo.nettailer.com/a/b?c=1") == "https://demo.nettailer.com"
    assert _origin("http://x.test:8080/p") == "http://x.test:8080"


@pytest.mark.skipif(
    os.environ.get("RUN_LIVE_NETTAILER_TEST") != "1",
    reason="Live network test — set RUN_LIVE_NETTAILER_TEST=1 to enable",
)
def test_live_nettailer_vat_toggle():
    """Hits demo.nettailer.com and confirms inc/exc prices differ by ~20%."""
    import asyncio

    from routers.scraper import _do_scrape

    url = (
        "https://demo.nettailer.com/product/Computers/Laptops/Razer/"
        "RZ09-03272W82-R3W1-Razer-Blade-Stealth-13---13-3---Intel-Core-i7---1"
        "?prodid=7111912"
    )
    data = asyncio.run(_do_scrape(url, vat_mode="incl"))
    inc = _parse_money(data.get("priceInc"))
    exc = _parse_money(data.get("priceExc"))
    assert inc is not None and exc is not None, data
    # UK standard VAT is 20%; allow ±1% rounding tolerance.
    ratio = inc / exc
    assert 1.19 < ratio < 1.21, f"Unexpected VAT ratio {ratio:.4f}: inc={inc} exc={exc}"
