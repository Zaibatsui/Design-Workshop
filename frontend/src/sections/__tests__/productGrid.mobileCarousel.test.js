/**
 * Product Grid — optional Mobile Carousel mode.
 *
 *   1. OFF by default (`mobileCarousel === false`).
 *   2. OFF render emits NO `is-m-carousel` modifier class, NO arrow
 *      buttons, NO `data-ns-mtrack` marker, and NO mobile-carousel JS.
 *   3. ON render adds the `is-m-carousel` modifier on the root section,
 *      adds `data-ns-mtrack` on the grid container, and emits the
 *      autoplay data-attrs on root.
 *   4. ON render emits arrow buttons by default (mobileCarouselArrows
 *      defaults to true) and the mobile-carousel JS engine.
 *   5. Arrows can be hidden by setting mobileCarouselArrows=false.
 *   6. Autoplay flag flows through to the root `data-ns-m-autoplay`
 *      attribute and into the snippet JS body.
 *   7. The mobile-carousel CSS lives inside the @media (max-width:640px)
 *      block so it never affects the desktop grid.
 *   8. The mobile-carousel JS is gated by matchMedia and runs only at
 *      ≤640px (so desktop rendering of the same snippet is untouched
 *      regardless of mobileCarousel setting).
 *
 * Run with: node src/sections/__tests__/productGrid.mobileCarousel.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

const STUBS = new Set([
  "@/components/FormFields",
  "@/components/ColorField",
  "@/components/ImageUpload",
  "@/components/ListEditor",
  "@/components/RichTextEditor",
  "@/components/BlogPagePicker",
  "@/components/PaddingFields",
  "@/components/FooterLinkEditor",
  "@/components/FormGroup",
  "@/components/ui/label",
  "@/components/ui/input",
  "@/components/ui/button",
  "lucide-react",
  "sonner",
  "react",
]);

const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) {
    return path.join(SRC_ROOT, request.slice(2)) + ".js";
  }
  return origResolve.call(this, request, parent, ...rest);
};

const origCompile = Module.prototype._compile;
require.extensions[".js"] = function (mod, filename) {
  if (filename.includes(`${path.sep}node_modules${path.sep}`)) {
    return origCompile.call(mod, fs.readFileSync(filename, "utf8"), filename);
  }
  const code = babel.transformSync(fs.readFileSync(filename, "utf8"), {
    filename,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  }).code;
  return origCompile.call(mod, code, filename);
};

const { productGrid } = require("../productGrid.js");

let failed = 0;
function expect(name, cond, extra) {
  if (cond) console.log("PASS \u00b7", name);
  else {
    console.log("FAIL \u00b7", name, extra ? `\n  ${extra}` : "");
    failed += 1;
  }
}

const baseDefaults = productGrid.defaults();

// ── 1. Defaults: mobileCarousel === false ──────────────────────────
{
  expect(
    "defaults.mobileCarousel === false",
    baseDefaults.mobileCarousel === false
  );
  expect(
    "defaults.mobileCarouselArrows === true",
    baseDefaults.mobileCarouselArrows === true
  );
  expect(
    "defaults.mobileCarouselAutoplay === false",
    baseDefaults.mobileCarouselAutoplay === false
  );
  expect(
    "defaults.mobileCarouselAutoplayInterval === 4000",
    baseDefaults.mobileCarouselAutoplayInterval === 4000
  );
}

// ── 2. OFF render emits no carousel markers / JS ────────────────────
{
  const out = productGrid.render({ ...baseDefaults });
  expect(
    "OFF: root section does NOT carry is-m-carousel",
    !/<section class="ns-pgrid [^"]*is-m-carousel/.test(out)
  );
  expect(
    "OFF: no data-ns-mtrack marker on .ns-grid",
    !/data-ns-mtrack/.test(out)
  );
  expect(
    "OFF: no arrow buttons emitted",
    !/data-ns-mprev/.test(out) && !/data-ns-mnext/.test(out)
  );
  expect(
    "OFF: no data-ns-m-autoplay attr on root",
    !/data-ns-m-autoplay=/.test(out)
  );
  expect(
    "OFF: no matchMedia gate emitted in JS",
    !/matchMedia\("\(max-width: 640px\)"\)/.test(out)
  );
}

// ── 3. ON render adds modifier + track marker + data attrs ─────────
{
  const out = productGrid.render({
    ...baseDefaults,
    mobileCarousel: true,
    products: [
      {
        id: "p1",
        name: "A",
        image: "https://e.com/a.png",
        price: "£1",
        priceSuffix: "",
        link: "#",
        overlay: "",
      },
      {
        id: "p2",
        name: "B",
        image: "https://e.com/b.png",
        price: "£2",
        priceSuffix: "",
        link: "#",
        overlay: "",
      },
    ],
  });
  expect(
    "ON: root section carries is-m-carousel modifier",
    /<section class="ns-pgrid [^"]*is-m-carousel/.test(out)
  );
  expect(
    "ON: .ns-grid carries data-ns-mtrack marker",
    /<div class="ns-grid" data-ns-mtrack>/.test(out)
  );
  expect(
    "ON: arrows + grid wrapped in <div class=\"ns-mcwrap\">",
    /<div class="ns-mcwrap">[\s\S]*?<div class="ns-grid" data-ns-mtrack>/.test(
      out
    )
  );
  expect(
    "ON: root carries data-ns-m-autoplay attr",
    /data-ns-m-autoplay="0"/.test(out)
  );
  expect(
    "ON: root carries data-ns-m-interval attr",
    /data-ns-m-interval="4000"/.test(out)
  );
}

// ── 4. Arrows render by default + JS engine present ────────────────
{
  const out = productGrid.render({ ...baseDefaults, mobileCarousel: true });
  expect(
    "ON + default: ‹ prev button rendered with data-ns-mprev",
    /<button class="ns-marrow ns-mprev"[^>]*data-ns-mprev[^>]*>‹<\/button>/.test(
      out
    )
  );
  expect(
    "ON + default: › next button rendered with data-ns-mnext",
    /<button class="ns-marrow ns-mnext"[^>]*data-ns-mnext[^>]*>›<\/button>/.test(
      out
    )
  );
  expect(
    "ON: matchMedia gate emitted in JS",
    /matchMedia\("\(max-width: 640px\)"\)/.test(out)
  );
  expect(
    "ON: clone-and-jump infinite loop engine emitted",
    /data-ns-clone/.test(out) && /mMaybeWrap/.test(out)
  );
}

// ── 5. Arrows can be hidden ────────────────────────────────────────
{
  const out = productGrid.render({
    ...baseDefaults,
    mobileCarousel: true,
    mobileCarouselArrows: false,
  });
  expect(
    "ON + arrows OFF: no ‹ prev button element emitted",
    !/<button [^>]*data-ns-mprev/.test(out)
  );
  expect(
    "ON + arrows OFF: no › next button element emitted",
    !/<button [^>]*data-ns-mnext/.test(out)
  );
  // The engine still emits because it works without arrows (swipe only).
  expect(
    "ON + arrows OFF: matchMedia gate still emitted",
    /matchMedia\("\(max-width: 640px\)"\)/.test(out)
  );
}

// ── 6. Autoplay flows through to root attr + interval honoured ─────
{
  const out = productGrid.render({
    ...baseDefaults,
    mobileCarousel: true,
    mobileCarouselAutoplay: true,
    mobileCarouselAutoplayInterval: 7500,
  });
  expect(
    "ON + autoplay: data-ns-m-autoplay === \"1\"",
    /data-ns-m-autoplay="1"/.test(out)
  );
  expect(
    "ON + autoplay: custom interval flows through to data-ns-m-interval",
    /data-ns-m-interval="7500"/.test(out)
  );
}

// ── 7. Mobile-carousel CSS sits inside the @media (max-width:640px) block
{
  const out = productGrid.render({ ...baseDefaults, mobileCarousel: true });
  const mqOpen = out.indexOf("@media (max-width:640px)");
  const carouselFlexRule = out.indexOf(".is-m-carousel .ns-grid{display:flex");
  const carouselArrowRule = out.indexOf(".is-m-carousel .ns-marrow{display:flex");
  expect(
    "@media (max-width:640px) block opens before .is-m-carousel rules",
    mqOpen > -1 && carouselFlexRule > mqOpen && carouselArrowRule > mqOpen
  );
  expect(
    "card flex-basis is 80% inside the mobile breakpoint (peek next card)",
    /\.is-m-carousel \.ns-card\{flex:0 0 80%/.test(out)
  );
  expect(
    "scroll-snap-type:x mandatory is set on the mobile track",
    /scroll-snap-type:x mandatory/.test(out)
  );
  expect(
    "scroll-snap-align:start is set on each card so swipe lands on a whole card",
    /\.is-m-carousel \.ns-card\{[^}]*scroll-snap-align:start/.test(out)
  );
  expect(
    "arrows are display:none at desktop scope (outside the @media block)",
    /\.ns-marrow\{display:none\}/.test(out)
  );
  // ── Arrow positioning (traditional carousel layout) ───────────
  expect(
    ".ns-mcwrap is positioned relative — the anchor for the arrows",
    /\.is-m-carousel \.ns-mcwrap\{position:relative\}/.test(out)
  );
  expect(
    "arrows are vertically centred on the image (top:105px, translateY(-50%))",
    /\.is-m-carousel \.ns-marrow\{[^}]*position:absolute[^}]*top:105px[^}]*transform:translateY\(-50%\)/.test(
      out
    )
  );
  expect(
    "prev arrow sits on the LEFT side (left:4px)",
    /\.is-m-carousel \.ns-mprev\{left:4px\}/.test(out)
  );
  expect(
    "next arrow sits on the RIGHT side (right:4px)",
    /\.is-m-carousel \.ns-mnext\{right:4px\}/.test(out)
  );
  // The legacy stacked-bottom-right positioning is gone.
  expect(
    "obsolete bottom:8px arrow positioning is removed",
    !/\.is-m-carousel \.ns-marrow\{[^}]*bottom:8px/.test(out)
  );
}

// ── 8. The engine cleans up clones + scroll position on deactivation
{
  const out = productGrid.render({ ...baseDefaults, mobileCarousel: true });
  expect(
    "ON: mDeactivate removes clones and resets scrollLeft",
    /mDeactivate[\s\S]{0,400}?mRemoveClones\(\)/.test(out) &&
      /mDeactivate[\s\S]{0,600}?mTrack\.scrollLeft=0/.test(out)
  );
  expect(
    "ON: matchMedia 'change' listener wired so resize across the breakpoint reinitialises",
    /addEventListener\("change",mSync\)/.test(out)
  );
}

console.log(`\n${failed === 0 ? "ALL PASSED" : `${failed} FAILED`}`);
process.exit(failed ? 1 : 0);
