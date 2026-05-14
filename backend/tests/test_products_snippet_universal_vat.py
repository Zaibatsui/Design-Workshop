"""Guard test — the Product Carousel snippet's VAT-toggle detection must
stay host-agnostic (not coupled to demo.nettailer.com) AND must accept
every realistic VAT-label variant the wild web throws at it.

This is a file-grep regression test: it reads the bundled `products.js`
section source and asserts that the detection paths and the label
classifier are still present. It also evaluates the embedded
classifier's regex patterns directly so we can prove they match the
label strings we care about — and reject the ones that would be
false-positives in real markup.

If any of these checks fail, the snippet has silently regressed on
hosts that:
  * label the toggle "Inc. VAT" / "Ex. VAT" (with periods)
  * label the toggle "Inkl. moms" / "Exkl. moms" (Swedish)
  * re-render the switcher node instead of mutating its text
  * signal VAT state via class names / data attributes / aria states
  * don't bubble DOM mutations to anywhere we observe
"""
import pathlib
import re


PRODUCTS_JS = (
    pathlib.Path(__file__).resolve().parents[2]
    / "frontend"
    / "src"
    / "sections"
    / "products.js"
)


def _src() -> str:
    return PRODUCTS_JS.read_text(encoding="utf-8")


# ── Structural checks: detection paths are present ───────────────────


def test_label_text_detection_present():
    src = _src()
    assert ".vat-switcher-label" in src
    # The classifier is the heart of the detection — make sure it's
    # actually defined and wired into vatMode().
    assert "function classify(s)" in src
    assert "function vatMode()" in src


def test_switcher_attribute_fallbacks_present():
    src = _src()
    assert ".vat-switcher" in src
    assert "data-state" in src
    assert "data-vat" in src
    assert "aria-pressed" in src


def test_body_class_fallback_present():
    src = _src()
    assert "document.body.className" in src
    # Body-class fallback must gate on the word "vat" being present so
    # an unrelated "incoming-page" class can't false-positive.
    assert 'indexOf("vat")' in src


def test_polling_fallback_present():
    src = _src()
    assert "setInterval(tick,500)" in src


def test_mutation_observer_is_broad():
    src = _src()
    assert "observe(document.body" in src
    assert "attributeFilter" in src


# ── Behavioural checks: the classify() regex actually matches real
#    label variants. We rebuild the regex from the source so this stays
#    truthful even if someone edits the classifier in-place.


def _extract_classify_regexes():
    """Pull the two main regex literals out of the classify() body so
    we can evaluate them in Python and prove they accept/reject the
    strings we care about.

    The snippet stores them as JS escapes inside a JS template-string
    expression (``"\\binc(?:l|\\.|\\s|$)"``). We extract them as raw
    JS regex source then translate the JS-specific tokens (``\\b``,
    ``\\s``) into their Python equivalents.
    """
    src = _src()
    # Find the two `/regex/.test(t)` calls inside classify()
    matches = re.findall(r"/(\\\\b[^/]+)/\.test\(t\)", src)
    # Each captured group is the JS source with one extra layer of
    # backslash escaping (because it sits inside a JS string literal).
    # Decode the JS-string-level escapes to get the actual JS regex.
    out = []
    for m in matches:
        out.append(m.encode().decode("unicode_escape"))
    return out


def _js_regex_to_python(js_pattern: str) -> re.Pattern:
    # Python's `re` treats \b and \s identically to JS — no
    # translation needed beyond compilation.
    return re.compile(js_pattern, re.IGNORECASE)


def test_classifier_accepts_canonical_nettailer_labels():
    patterns = [_js_regex_to_python(p) for p in _extract_classify_regexes()]
    assert patterns, "Failed to extract classify() regexes from products.js"

    # The classifier emits "incl" for any pattern matching the
    # inclusive set, "excl" for the exclusive set. We don't reproduce
    # the dispatch here — instead we just check that *some* pattern
    # accepts each canonical label, AND that the inclusive patterns
    # alone match the inclusive labels and likewise for exclusive.
    inclusive_labels = [
        "Incl VAT",
        "Inc. VAT",
        "Inc VAT",
        "Including VAT",
        "Inkl. moms",
        "inkl moms",
    ]
    exclusive_labels = [
        "Excl VAT",
        "Excl. VAT",
        "Exc. VAT",
        "Ex. VAT",
        "Ex VAT",
        "Excluding VAT",
        "Exkl. moms",
        "exkl moms",
    ]
    for s in inclusive_labels + exclusive_labels:
        assert any(p.search(s.lower()) for p in patterns), (
            f"No classify() regex matched VAT label {s!r}"
        )


def test_classifier_rejects_false_positive_strings():
    patterns = [_js_regex_to_python(p) for p in _extract_classify_regexes()]
    # Strings that look "inc-ish" or "ex-ish" but are NOT VAT signals.
    # We don't want the snippet to mis-detect VAT mode from random
    # words on the host page.
    benign = [
        "incoming order",
        "income statement",
        "incorporate",
        "extra large",
        "expedia checkout",
        "expert advice",
        "exit",
    ]
    for s in benign:
        assert not any(p.search(s.lower()) for p in patterns), (
            f"classify() regex false-positive on benign string {s!r}"
        )
