/**
 * Smoke tests for the mobile-specific knobs added to `hero.js`:
 *   • Per-slide mobile image swap (CSS var --ns-bg-m + <picture>)
 *   • Split-panel mobile background override (CSS var --ns-pb-m)
 *   • Mobile gap between image and panel on split slides
 *   • Mobile text-align ("center" toggles .is-mobile-center class)
 *   • Arrows visibility ("desktop" / "mobile" / "never" / "always")
 *   • Dots-overlap safe padding (`.has-dots` class hook)
 *   • Touch-swipe handlers present in emitted JS
 *
 * hero.js imports JSX/React components so we use esbuild to strip
 * JSX and convert ESM → CJS before requiring it, then drive the
 * exported `hero.render(cfg)` against the snippet output. The
 * <FormPanel> React component is not exercised here — only the
 * pure HTML/CSS/JS snippet path that downstream sites consume.
 *
 * Run with: node src/sections/__tests__/hero.mobile.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

// Resolve `@/...` aliases (project uses jsconfig `paths`) by mapping
// to /app/frontend/src/...
const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");
  const out = babel.transformSync(src, {
    filename: filePath,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  });
  return out.code;
}

// Custom loader: when require()d, transform `.js`/.jsx files through
// esbuild and resolve `@/x` to `/app/frontend/src/x`. Stub out any
// import we don't care about for the render path (FormFields,
// ColorField, ImageUpload, ListEditor, ui/label, lucide-react,
// FormGroup) so we never need a real React runtime.
const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/PaddingFields",
  "@/components/FooterLinkEditor",
  "@/components/ui/label",
  "@/components/FormGroup",
  "lucide-react",
]);

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) {
    return path.join(SRC_ROOT, request.slice(2)) + ".js";
  }
  return origResolve.call(this, request, parent, ...rest);
};

// Write a tiny stub once.
const stubPath = path.join(__dirname, "_hero_stub.js");
if (!fs.existsSync(stubPath)) {
  fs.writeFileSync(
    stubPath,
    "module.exports = new Proxy({}, { get: () => () => null });\n"
  );
}

// Install a `.js` extension hook that runs each loaded file through
// esbuild. We only need this for the hero + shared chain.
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) {
    return origJsExt(module, filename);
  }
  const code = transformFile(filename);
  module._compile(code, filename);
};

const { hero } = require("../hero.js");

let passed = 0;
let failed = 0;
function expect(label, cond, extra = "") {
  if (cond) {
    console.log(`PASS · ${label}`);
    passed++;
  } else {
    console.log(`FAIL · ${label}${extra ? "\n   " + extra : ""}`);
    failed++;
  }
}

function baseCfg(overrides = {}) {
  const cfg = hero.defaults();
  return { ...cfg, ...overrides };
}

// ─── Test 1: per-slide mobile image swap (slide transition) ──────────
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].image = "https://a.test/desktop.jpg";
  cfg.slides[0].imageMobile = "https://a.test/mobile.jpg";
  const code = hero.render(cfg);
  expect(
    "Slide transition emits --ns-bg-m for per-slide mobile image",
    code.includes("--ns-bg-m:url('https://a.test/mobile.jpg')") &&
      code.includes("background-image:var(--ns-bg-m, var(--ns-bg))")
  );
}

// ─── Test 2: arrows visibility dropdown ──────────────────────────────
{
  const cases = [
    ["always", true, false, false],
    ["desktop", true, true, false],
    ["mobile", true, false, true],
    ["never", false, false, false],
  ];
  for (const [vis, hasArrows, hasDesktopCls, hasMobileCls] of cases) {
    const cfg = baseCfg();
    cfg.settings.arrowsVisibility = vis;
    const code = hero.render(cfg);
    // Only inspect the `<section class="...">` attr to check class
    // hooks — the full code contains CSS rule selectors mentioning
    // those class names regardless of which class is actually
    // applied.
    const m = code.match(/<section class="([^"]+)"/);
    const sectionCls = m ? m[1] : "";
    // The selector `data-ns-prev` also appears in the JS body
    // (`querySelector("[data-ns-prev]")`) regardless of arrow
    // visibility — what we actually care about is whether the
    // `<button … data-ns-prev …>` element was emitted in the HTML.
    const arrowsRendered = /<button[^>]*data-ns-prev/.test(code);
    const desktopClsPresent = / is-arrows-desktop(\s|$)/.test(sectionCls);
    const mobileClsPresent = / is-arrows-mobile(\s|$)/.test(sectionCls);
    expect(
      `Arrows visibility=${vis} → arrows-html:${hasArrows} desktop-cls:${hasDesktopCls} mobile-cls:${hasMobileCls}`,
      arrowsRendered === hasArrows &&
        desktopClsPresent === hasDesktopCls &&
        mobileClsPresent === hasMobileCls,
      `actual: arrows-html:${arrowsRendered} desktop-cls:${desktopClsPresent} mobile-cls:${mobileClsPresent} section-cls="${sectionCls}"`
    );
  }
}

// ─── Test 3: mobile center class + text-align var ────────────────────
{
  const cfg = baseCfg();
  cfg.layout.textAlign = "left";
  cfg.layout.textAlignMobile = "center";
  const code = hero.render(cfg);
  expect(
    "textAlignMobile=center adds .is-mobile-center and sets --ns-text-align-m:center",
    code.includes("is-mobile-center") &&
      code.includes("--ns-text-align-m:center") &&
      code.includes(".is-mobile-center .ns-content")
  );
}

// ─── Test 4: dots overlap safe padding ───────────────────────────────
{
  const cfgOn = baseCfg();
  cfgOn.settings.showDots = true;
  const onCode = hero.render(cfgOn);
  const cfgOff = baseCfg();
  cfgOff.settings.showDots = false;
  const offCode = hero.render(cfgOff);
  const onCls = (onCode.match(/<section class="([^"]+)"/) || [])[1] || "";
  const offCls = (offCode.match(/<section class="([^"]+)"/) || [])[1] || "";
  expect(
    "has-dots class added when dots on (safe-pad rule reachable); not when off",
    / has-dots(\s|$)/.test(onCls) &&
      onCode.includes(".has-dots .ns-content{padding-bottom:48px}") &&
      !/ has-dots(\s|$)/.test(offCls)
  );
}

// ─── Test 5: split panel mobile gradient override ────────────────────
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.theme.panelBgTypeMobile = "gradient";
  cfg.theme.panelGradientFromMobile = "#ff0000";
  cfg.theme.panelGradientToMobile = "#0000ff";
  cfg.theme.panelGradientAngleMobile = 45;
  const code = hero.render(cfg);
  expect(
    "Split mobile gradient emitted as --ns-pb-m linear-gradient + media-query swap",
    code.includes(
      "--ns-pb-m:linear-gradient(45deg, #ff0000 0%, #0000ff 100%)"
    ) && code.includes("background:var(--ns-pb-m, var(--ns-pb))")
  );
}

// ─── Test 6: mobile image-panel gap was deprecated in Feb 2026 ───────
// The gap CSS is now hardcoded to 0 since the explicit grid-row pinning
// makes image and panel flush by design. Existing snippets stay valid;
// the field is kept on the config schema for back-compat but no longer
// surfaces in the editor UI.
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.layout.mobileImagePanelGap = 16;
  const code = hero.render(cfg);
  expect(
    "Section mobile gap is now hardcoded 0 (slider deprecated)",
    code.includes(".ns-split-grid{grid-template-columns:1fr;grid-template-rows:auto 1fr;height:100%;align-content:start;gap:0}")
  );
}
{
  // Per-slide override emits --ns-mig on the slide root.
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].mobileImagePanelGap = 24;
  cfg.layout.mobileImagePanelGap = 0;
  const code = hero.render(cfg);
  expect(
    "Per-slide mobileImagePanelGap=24 → --ns-mig:24px in slide root style",
    /class="ns-slide is-split[^"]*"[^>]*style="[^"]*--ns-mig:24px/.test(code)
  );
}
{
  // Per-slide imageSide + panelRatio emit --ns-grid-cols on slide root.
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].imageSide = "left";
  cfg.slides[0].panelRatio = 60;
  cfg.layout.imageSide = "right";
  cfg.layout.panelRatio = 50;
  const code = hero.render(cfg);
  expect(
    "Per-slide imageSide=left + panelRatio=60 → --ns-grid-cols:40% 60%",
    /--ns-grid-cols:40% 60%/.test(code)
  );
}
{
  // No per-slide override → no --ns-grid-cols on slide root (inherits
  // section default from CSS rule's var fallback).
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  const code = hero.render(cfg);
  expect(
    "No per-slide split override → --ns-grid-cols NOT emitted on slide root",
    !/class="ns-slide is-split[^"]*"[^>]*style="[^"]*--ns-grid-cols/.test(code)
  );
}

// ─── Test 7: touch swipe handlers present in JS ──────────────────────
{
  const cfgSlide = baseCfg({ transition: "slide" });
  const cfgFade = baseCfg({ transition: "fade" });
  const slideCode = hero.render(cfgSlide);
  const fadeCode = hero.render(cfgFade);
  expect(
    "Both slide + fade transitions register touchstart/touchend swipe",
    slideCode.includes("touchstart") &&
      slideCode.includes("touchend") &&
      fadeCode.includes("touchstart") &&
      fadeCode.includes("touchend")
  );
}

// ─── Test 8: back-compat: legacy showArrows=false → never ────────────
{
  const cfg = baseCfg();
  cfg.settings.showArrows = false;
  delete cfg.settings.arrowsVisibility;
  const code = hero.render(cfg);
  expect(
    "Back-compat: showArrows:false (no arrowsVisibility) → arrows not emitted",
    !/<button[^>]*data-ns-prev/.test(code)
  );
}

// ─── Test: __nsHeroIndex slide-lock applies BEFORE paint via jsdom ─────
// The Editor preview iframe bakes `window.__nsHeroIndex=N` into the
// document head. The hero IIFE must read it and apply the active-slide
// class synchronously when its <script> tag is parsed (i.e. before
// jsdom returns control after document construction). If we instead
// wait for DOMContentLoaded the user sees slide 0 flash between paint
// and our boot — that was the source of the slider-drag flicker.
{
  const { JSDOM } = require("jsdom");

  // Build a minimal previewDoc-style document with bake script in head.
  const cfg = baseCfg({ transition: "fade" });
  cfg.slides.push(
    { id: "b", title: "Slide 2", subtitle: "", image: "", logo: "", ctaText: "", ctaLink: "#" },
    { id: "c", title: "Slide 3", subtitle: "", image: "", logo: "", ctaText: "", ctaLink: "#" }
  );
  const snippet = hero.render(cfg);
  const doc = `<!doctype html><html><head><script>window.__nsHeroIndex=2;</script></head><body>${snippet}</body></html>`;
  const dom = new JSDOM(doc, { runScripts: "dangerously" });
  // After JSDOM construction, all sync scripts have run. The active
  // slide must already be index 2 — NOT index 0.
  const slides = dom.window.document.querySelectorAll(".ns-slide");
  const activeIdx = Array.from(slides).findIndex((el) =>
    el.classList.contains("is-active")
  );
  expect(
    "Fade transition: __nsHeroIndex=2 applies is-active to slide 2 synchronously",
    activeIdx === 2,
    `actual activeIdx=${activeIdx} (slide count=${slides.length})`
  );
}

// Same test for the slide (track) transition — the IIFE uses
// `track.style.transform` instead of the is-active class.
{
  const { JSDOM } = require("jsdom");
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides.push(
    { id: "b", title: "Slide 2", subtitle: "", image: "", logo: "", ctaText: "", ctaLink: "#" },
    { id: "c", title: "Slide 3", subtitle: "", image: "", logo: "", ctaText: "", ctaLink: "#" }
  );
  const snippet = hero.render(cfg);
  const doc = `<!doctype html><html><head><script>window.__nsHeroIndex=2;</script></head><body>${snippet}</body></html>`;
  const dom = new JSDOM(doc, { runScripts: "dangerously" });
  const track = dom.window.document.querySelector("[data-ns-track]");
  const tx = (track && track.style.transform) || "";
  expect(
    "Slide transition: __nsHeroIndex=2 sets track transform to -300% (real slide 2 at clone-offset index 3)",
    /translateX\(-300%\)/.test(tx),
    `actual transform="${tx}"`
  );
}

// And the default case: no __nsHeroIndex → boots on slide 0 + autoplay.
{
  const { JSDOM } = require("jsdom");
  const cfg = baseCfg({ transition: "fade" });
  cfg.slides.push(
    { id: "b", title: "Slide 2", subtitle: "", image: "", logo: "", ctaText: "", ctaLink: "#" }
  );
  const snippet = hero.render(cfg);
  const doc = `<!doctype html><html><head></head><body>${snippet}</body></html>`;
  const dom = new JSDOM(doc, { runScripts: "dangerously" });
  const slides = dom.window.document.querySelectorAll(".ns-slide");
  const activeIdx = Array.from(slides).findIndex((el) =>
    el.classList.contains("is-active")
  );
  expect(
    "No __nsHeroIndex → defaults to slide 0",
    activeIdx === 0,
    `actual activeIdx=${activeIdx}`
  );
}

// ─── Overlay model tests ──────────────────────────────────────────────
// Hero gained per-viewport overlay controls (solid / gradient / default).
// These verify the right CSS variables are emitted for each mode and
// transition, including the legacy default look (no controls set).
{
  // Slide transition + overlayType=default → legacy left-to-right
  // dark gradient at full opacity.
  const cfg = baseCfg({ transition: "slide" });
  const code = hero.render(cfg);
  expect(
    "Slide+default → legacy gradient applied via --ns-overlay-bg",
    /--ns-overlay-bg:linear-gradient\(90deg,rgba\(0,0,0,\.75\) 0%/.test(code) &&
      /--ns-overlay-op:1/.test(code)
  );
}
{
  // Solid overlay applies overlayColor at overlayOpacity.
  const cfg = baseCfg({ transition: "slide" });
  cfg.theme.overlayType = "solid";
  cfg.theme.overlayColor = "#123456";
  cfg.theme.overlayOpacity = 0.6;
  const code = hero.render(cfg);
  expect(
    "Solid overlay → --ns-overlay-bg:#123456 + --ns-overlay-op:0.6",
    /--ns-overlay-bg:#123456/.test(code) && /--ns-overlay-op:0\.6/.test(code)
  );
}
{
  // Gradient overlay uses linear-gradient(angle, from, to).
  const cfg = baseCfg({ transition: "fade" });
  cfg.theme.overlayType = "gradient";
  cfg.theme.overlayGradientFrom = "#ff0000";
  cfg.theme.overlayGradientTo = "#00ff00";
  cfg.theme.overlayGradientAngle = 45;
  cfg.theme.overlayOpacity = 0.8;
  const code = hero.render(cfg);
  expect(
    "Gradient overlay → linear-gradient(45deg,#ff0000 0%,#00ff00 100%)",
    /--ns-overlay-bg:linear-gradient\(45deg, #ff0000 0%, #00ff00 100%\)/.test(code) &&
      /--ns-overlay-op:0\.8/.test(code)
  );
}
{
  // Mobile override emits the -m suffixed vars; desktop vars stay.
  const cfg = baseCfg({ transition: "slide" });
  cfg.theme.overlayTypeMobile = "solid";
  cfg.theme.overlayColorMobile = "#abcdef";
  cfg.theme.overlayOpacityMobile = 0.3;
  const code = hero.render(cfg);
  expect(
    "Mobile solid override → --ns-overlay-bg-m + --ns-overlay-op-m emitted",
    /--ns-overlay-bg-m:#abcdef/.test(code) &&
      /--ns-overlay-op-m:0\.3/.test(code)
  );
}
{
  // No mobile override → no -m custom-property *assignments* (the
  // @media rule still references `var(--ns-overlay-bg-m, …)` as a
  // fallback lookup, so we have to check for the colon-assignment
  // form specifically — not just the identifier).
  const cfg = baseCfg({ transition: "slide" });
  const code = hero.render(cfg);
  expect(
    "No mobile override → no --ns-overlay-bg-m assignment emitted",
    !/--ns-overlay-bg-m:[^,)]/.test(code) &&
      !/--ns-overlay-op-m:[^,)]/.test(code)
  );
}

// ─── Mobile layout overrides ──────────────────────────────────────────
// `layout.mobileLayoutOverride` toggle gates the *Mobile fields. When
// off (default), the renderer emits no `--ns-*-m` layout var
// assignments and the @media fallback keeps the desktop value live.
// When on, only fields with non-null values are emitted.
{
  const cfg = baseCfg();
  const code = hero.render(cfg);
  expect(
    "Layout: override off → no --ns-height-m / --ns-content-max-m / --ns-radius-m emitted",
    !/--ns-height-m:[^,)]/.test(code) &&
      !/--ns-content-max-m:[^,)]/.test(code) &&
      !/--ns-radius-m:[^,)]/.test(code)
  );
  // The @media rule still references them as fallbacks — that's
  // what makes "inherit desktop" work — so the bare identifier IS
  // expected in the output:
  expect(
    "Layout: media query references --ns-height-m as fallback",
    /var\(--ns-height-m, var\(--ns-height\)\)/.test(code)
  );
}
{
  const cfg = baseCfg();
  cfg.layout.mobileLayoutOverride = true;
  cfg.layout.heightMobile = 360;
  cfg.layout.contentMaxWidthMobile = 480;
  const code = hero.render(cfg);
  expect(
    "Layout: override on with values → emits --ns-height-m:360px",
    /--ns-height-m:360px/.test(code) &&
      /--ns-content-max-m:480px/.test(code)
  );
  expect(
    "Layout: override on, radiusMobile null → --ns-radius-m NOT emitted (inherits desktop)",
    !/--ns-radius-m:[^,)]/.test(code)
  );
}
{
  // Even with override on, blank string fields inherit (same null
  // semantics) — guards against e.g. cleared sliders sending "".
  const cfg = baseCfg();
  cfg.layout.mobileLayoutOverride = true;
  cfg.layout.heightMobile = "";
  cfg.layout.borderRadiusMobile = 12;
  const code = hero.render(cfg);
  expect(
    'Layout: heightMobile="" → not emitted (inherits)',
    !/--ns-height-m:[^,)]/.test(code) && /--ns-radius-m:12px/.test(code)
  );
}

// ─── Per-slide overlay overrides (Stage 2) ────────────────────────────
{
  const cfg = baseCfg({ transition: "fade" });
  cfg.slides[0].overlayType = "solid";
  cfg.slides[0].overlayColor = "#ff0000";
  cfg.slides[0].overlayOpacity = 0.8;
  const code = hero.render(cfg);
  expect(
    "Slide overlay override → --ns-overlay-bg / --ns-overlay-op on slide root",
    /class="ns-slide[^"]*"[^>]*style="[^"]*--ns-overlay-bg:#ff0000;--ns-overlay-op:0\.8/.test(
      code
    )
  );
}
{
  const cfg = baseCfg({ transition: "fade" });
  cfg.theme.overlayType = "solid";
  cfg.theme.overlayColor = "#000000";
  const code = hero.render(cfg);
  expect(
    "No slide overlay override → no --ns-overlay-bg on slide root",
    !/class="ns-slide[^"]*"[^>]*style="[^"]*--ns-overlay-bg/.test(code)
  );
}
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].overlayType = "solid";
  cfg.slides[0].overlayColor = "#ff0000";
  const code = hero.render(cfg);
  expect(
    "Split slide ignores overlay override (no emission)",
    !/class="ns-slide is-split[^"]*"[^>]*style="[^"]*--ns-overlay-bg/.test(code)
  );
}
{
  const cfg = baseCfg({ transition: "fade" });
  cfg.slides[0].overlayTypeMobile = "solid";
  cfg.slides[0].overlayColorMobile = "#0000ff";
  cfg.slides[0].overlayOpacityMobile = 0.4;
  const code = hero.render(cfg);
  expect(
    "Slide mobile-only overlay → --ns-overlay-bg-m on slide root",
    /class="ns-slide[^"]*"[^>]*style="[^"]*--ns-overlay-bg-m:#0000ff/.test(
      code
    )
  );
}

// ─── Regression: split-slide mobile grid pins each item to a row via
// `grid-row` and uses `grid-template-rows: auto 1fr` so all slides in
// a carousel stay the same height — the panel stretches to fill the
// section's `min-height`. This guards against regressing back to
// content-sized rows (which made each slide a different height).
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].imageUrl = "https://a.test/split.jpg";
  const code = hero.render(cfg);
  expect(
    "Split slide mobile grid declares grid-template-rows:auto 1fr",
    code.includes(".ns-split-grid{grid-template-columns:1fr;grid-template-rows:auto 1fr")
  );
  expect(
    "Split slide mobile pins image-wrap to grid-row:1",
    code.includes(".ns-image-wrap{order:1;grid-row:1")
  );
  expect(
    "Split slide mobile pins panel to grid-row:2",
    code.includes(".ns-panel{order:2;grid-row:2")
  );
}

// Same regression for fade mode (uses the same shared CSS function).
{
  const cfg = baseCfg({ transition: "fade" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].imageUrl = "https://a.test/split.jpg";
  const code = hero.render(cfg);
  expect(
    "Fade split slide mobile grid declares grid-template-rows:auto 1fr",
    code.includes(".ns-split-grid{grid-template-columns:1fr;grid-template-rows:auto 1fr")
  );
}

// ─── Regression: mixed-layout carousels on mobile must give every
// slide the same height. When any split slide is present the
// section is auto-height with a min, so standard slides (which
// originally carried `height:100%`) need to stretch to match the
// tallest split's content via `align-self:stretch`. Otherwise the
// page bounces vertically as the carousel transitions between
// short standard slides and tall split slides.
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].imageUrl = "https://a.test/split.jpg";
  // Force second slide to be standard
  cfg.slides[1] = { ...cfg.slides[1], layout: "standard", imageUrl: "https://a.test/std.jpg" };
  const code = hero.render(cfg);
  expect(
    "Mixed carousel: any .ns-slide stretches to tallest when split is present",
    code.includes(":has(.ns-slide.is-split) .ns-slide{height:auto;min-height:var(--ns-height-m, var(--ns-height));align-self:stretch}")
  );
}

// ─── Regression: fade carousels with split slides on mobile must
// grow to fit the tallest panel content. Fade slides are normally
// position:absolute, which means they contribute nothing to the
// parent's height and tall panel content gets clipped to the
// section min-height. Switching the section to a grid stack with
// all slides at grid-area:1/1 lets the tallest slide drive the
// cell height while preserving the opacity cross-fade. The marker
// `.is-fade` class on the section root targets this rule to fade
// renders only — the slide (translateX) variant keeps its track.
{
  const cfg = baseCfg({ transition: "fade" });
  cfg.slides[0].layout = "split";
  cfg.slides[0].imageUrl = "https://a.test/split.jpg";
  const code = hero.render(cfg);
  expect(
    "Fade section root carries `is-fade` marker class",
    code.includes('class="ns-hero ') && /class="ns-hero [^"]*is-fade/.test(code)
  );
  expect(
    "Fade mixed carousel: section becomes display:grid when split present",
    code.includes(".is-fade:has(.ns-slide.is-split){display:grid;grid-template-columns:1fr}")
  );
  expect(
    "Fade mixed carousel: slides stack at grid-area:1/1 with align-self:stretch",
    code.includes(".is-fade:has(.ns-slide.is-split) .ns-slide{position:relative;inset:auto;grid-area:1/1;align-self:stretch}")
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
