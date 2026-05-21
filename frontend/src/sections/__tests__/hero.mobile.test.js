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

// ─── Test 6: mobile image-panel gap (split) ──────────────────────────
{
  const cfg = baseCfg({ transition: "slide" });
  cfg.slides[0].layout = "split";
  cfg.layout.mobileImagePanelGap = 16;
  const code = hero.render(cfg);
  expect(
    "Mobile gap=16px shows up in grid-template-columns:1fr;gap:16px",
    code.includes("grid-template-columns:1fr;gap:16px")
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
    "Slide transition: __nsHeroIndex=2 sets track transform to -200% synchronously",
    /translateX\(-200%\)/.test(tx),
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

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
