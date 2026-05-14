"""Guard test — the Product Carousel snippet's VAT-toggle detection must
stay host-agnostic (not coupled to demo.nettailer.com).

This is a file-grep regression test: it reads the bundled `products.js`
section source and asserts that the three independent detection paths
introduced for cross-host portability are still present:

  1. `.vat-switcher-label` text reader (the canonical Nettailer skin).
  2. `.vat-switcher` data/class/aria fallbacks (handles skins that
     replace the label node on toggle, or signal state via attributes
     instead of text).
  3. body-level class fallback (some white-labels toggle on `<body>`).
  4. `setInterval(tick,500)` polling fallback (guarantees a flip on any
     host whose DOM mutations aren't observable by our MutationObserver).

If any of these is removed, the snippet silently regresses on hosts
that aren't demo.nettailer.com — which is exactly the bug this test is
designed to prevent.
"""
import pathlib


PRODUCTS_JS = (
    pathlib.Path(__file__).resolve().parents[2]
    / "frontend"
    / "src"
    / "sections"
    / "products.js"
)


def _src() -> str:
    return PRODUCTS_JS.read_text(encoding="utf-8")


def test_label_text_detection_present():
    src = _src()
    assert ".vat-switcher-label" in src
    assert 'indexOf("incl")' in src
    assert 'indexOf("excl")' in src


def test_switcher_attribute_fallbacks_present():
    src = _src()
    # The .vat-switcher attribute / class / aria fallback block must
    # read all three signal types so we cover the common skin variants.
    assert ".vat-switcher" in src
    assert "data-state" in src
    assert "data-vat" in src
    assert "aria-pressed" in src


def test_body_class_fallback_present():
    src = _src()
    # The body-level class fallback is the last line of defence for
    # white-labels that signal VAT mode via a class on <body>.
    assert 'document.body.className' in src
    assert 'inc-vat' in src
    assert 'exc-vat' in src


def test_polling_fallback_present():
    src = _src()
    # Polling is the only thing that guarantees the snippet works on
    # hosts whose DOM updates don't bubble in a way we observe.
    # Removing this is a recipe for regressions like the one reported
    # against non-demo Nettailer instances in Feb 2026.
    assert "setInterval(tick,500)" in src


def test_mutation_observer_is_broad():
    src = _src()
    # We observe document.body with attributeFilter so node-replacement
    # toggles + class/data/aria changes are all picked up. A targeted
    # observer on `.vat-switcher-label` alone (the prior implementation)
    # broke when the host re-rendered the switcher.
    assert "observe(document.body" in src
    assert 'attributeFilter' in src
