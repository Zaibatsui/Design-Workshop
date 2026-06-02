/**
 * Frame generator for the Design Workshop product walkthrough reel.
 *
 * Storyboard (30 seconds):
 *   00.0 – 03.0  T1  Cold open / brand title
 *   03.0 – 06.0  T2  "23 composable sections" — section grid wall
 *   06.0 – 10.0  T3  Hero snippet showcase (live render)
 *   10.0 – 13.5  T4  Split Banner + Featured Card (mid-page sections)
 *   13.5 – 17.0  T5  Stat Counter (the new section)
 *   17.0 – 20.0  T6  Video Embed (the other new section)
 *   20.0 – 23.0  T7  Comparison Table — B2B firepower
 *   23.0 – 26.0  T8  "Brand kit themes everything in one click"
 *   26.0 – 28.5  T9  "Self-contained snippet — paste & go"
 *   28.5 – 30.0  T10 CTA / outro
 *
 * Each shot is rendered to its own HTML file at 1920×1080. The orchestrator
 * (build.sh) captures every shot with headless Chromium, then ffmpeg
 * stitches the shots into MP4s with subtle Ken-Burns zoom + crossfades.
 *
 * Each shot exports:
 *   • shot-NN-a.png  — start frame (used as the still in the final MP4)
 *
 * Some shots additionally export motion intent flags consumed by build.sh
 * (e.g. zoom-direction). Kept minimal — fancy motion stays in ffmpeg.
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../frontend/src");
const OUT_DIR = path.resolve(__dirname, "frames");

// ---- Bring up the snippet renderers (same Babel-on-require loader we use
// in the section tests). We don't need React itself — only the pure render()
// functions, which produce HTML+CSS+JS strings.
function tf(f) {
  return babel.transformSync(fs.readFileSync(f, "utf8"), {
    filename: f,
    babelrc: false,
    configFile: false,
    presets: [
      [require.resolve("@babel/preset-env"), { targets: { node: "18" } }],
      [require.resolve("@babel/preset-react"), { runtime: "classic" }],
    ],
  }).code;
}

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
const stubFile = path.join(SRC_ROOT, "sections/__tests__/_hero_stub.js");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (req, parent, ...rest) {
  if (STUBS.has(req)) return stubFile;
  if (req.startsWith("@/")) return path.join(SRC_ROOT, req.slice(2)) + ".js";
  return origResolve.call(this, req, parent, ...rest);
};
const origJs = require.extensions[".js"];
require.extensions[".js"] = function (m, f) {
  if (!f.startsWith(SRC_ROOT)) return origJs(m, f);
  m._compile(tf(f), f);
};

const { hero } = require(path.join(SRC_ROOT, "sections/hero.js"));
const { splitBanner } = require(path.join(SRC_ROOT, "sections/splitBanner.js"));
const { featuredCard } = require(path.join(SRC_ROOT, "sections/featuredCard.js"));
const { statCounter } = require(path.join(SRC_ROOT, "sections/statCounter.js"));
const { videoEmbed } = require(path.join(SRC_ROOT, "sections/videoEmbed.js"));
const { comparisonTable } = require(path.join(SRC_ROOT, "sections/comparisonTable.js"));
const { trustStrip } = require(path.join(SRC_ROOT, "sections/trustStrip.js"));

// ---- Shared frame shell -------------------------------------------------
// 1920×1080, brand-matched dark base, monospace shot label in top-right, big
// kicker line bottom-centred. Text overlays sit on top of the section that's
// being highlighted on each shot.
function frameShell({
  shotNo,
  label,
  kicker,
  sub,
  body,
  // Optional inner snippet HTML (full document fragment for the snippet
  // renderer's output); rendered scaled-down behind the kicker text.
  snippet,
  align = "center",
  // Apply a ghosted, slightly translucent overlay so the kicker stays
  // legible regardless of underlying snippet colours.
  scrim = "rgba(8,11,20,0.55)",
  // Override frame background — useful for full-bleed brand title shots.
  bg = "#0b0f1a",
}) {
  const kickerBlock = kicker
    ? `<div class="kicker ${align}">
         <p class="eyebrow">${shotNo === "01" ? "Design Workshop" : "Design Workshop · 2026"}</p>
         <h1>${kicker}</h1>
         ${sub ? `<p class="sub">${sub}</p>` : ""}
         ${body ? `<p class="body">${body}</p>` : ""}
       </div>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
html,body{margin:0;padding:0;width:1920px;height:1080px;font-family:'Inter',system-ui,sans-serif;color:#fff;background:${bg};overflow:hidden}
.stage{position:relative;width:1920px;height:1080px;overflow:hidden}
.stage::after{content:'';position:absolute;inset:0;background:${scrim};pointer-events:none;z-index:5}
.snippet{position:absolute;inset:0;z-index:0;display:flex;align-items:center;justify-content:center}
.snippet > div{width:100%;height:100%;overflow:hidden}
.kicker{position:absolute;z-index:10;max-width:1280px;left:50%;transform:translateX(-50%);text-align:center}
.kicker.left{left:96px;transform:none;text-align:left}
.kicker.bottom{bottom:80px;top:auto}
.kicker{top:50%;transform:translate(-50%,-50%)}
.kicker.left{top:50%;transform:translateY(-50%)}
.kicker.bottom.left{top:auto;bottom:80px;transform:none}
.eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;font-weight:500;letter-spacing:0.38em;text-transform:uppercase;color:#E01839;margin:0 0 28px;text-align:inherit}
.kicker h1{font-size:88px;font-weight:700;line-height:1.04;letter-spacing:-0.025em;margin:0;color:#fff;text-wrap:balance}
.kicker .sub{margin:32px auto 0;max-width:880px;font-size:30px;font-weight:500;line-height:1.35;color:rgba(255,255,255,0.86);letter-spacing:-0.01em;text-wrap:balance}
.kicker.left .sub{margin-left:0;margin-right:0}
.kicker .body{margin:24px auto 0;max-width:760px;font-size:20px;line-height:1.55;color:rgba(255,255,255,0.7);text-wrap:balance}
.kicker.left .body{margin-left:0;margin-right:0}
.shotid{position:absolute;top:48px;right:64px;z-index:20;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.42);text-transform:uppercase}
.shotid::before{content:'';display:inline-block;width:14px;height:1px;background:#E01839;vertical-align:middle;margin-right:10px}
.brand{position:absolute;bottom:48px;left:64px;z-index:20;display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.55);text-transform:uppercase}
.brand .dot{width:10px;height:10px;background:#E01839;border-radius:50%;box-shadow:0 0 0 4px rgba(224,24,57,0.18)}
.progress{position:absolute;bottom:0;left:0;right:0;height:3px;z-index:20;background:rgba(255,255,255,0.06)}
.progress .bar{height:100%;background:#E01839;width:${Math.round((parseInt(shotNo, 10) / 10) * 100)}%}
.tag{display:inline-flex;align-items:center;gap:10px;padding:8px 14px;background:rgba(224,24,57,0.14);border:1px solid rgba(224,24,57,0.6);color:#fda4af;border-radius:99px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:36px}
.tag .dot{width:7px;height:7px;background:#E01839;border-radius:50%;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
.bullets{display:flex;flex-direction:column;gap:20px;margin-top:42px;max-width:920px;text-align:left}
.bullets.center{margin-left:auto;margin-right:auto}
.bullets li{display:flex;align-items:flex-start;gap:18px;font-size:24px;line-height:1.5;color:rgba(255,255,255,0.92);list-style:none}
.bullets li::before{content:'';flex-shrink:0;width:14px;height:14px;border-radius:3px;margin-top:12px;background:#E01839;box-shadow:0 0 0 4px rgba(224,24,57,0.18)}
.bullets li b{color:#fff;font-weight:600}
.grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(6,1fr);gap:14px;padding:60px}
.tile{background:linear-gradient(135deg,rgba(224,24,57,0.14) 0%,rgba(15,23,42,0.55) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:24px;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;height:auto;color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.01em;overflow:hidden;position:relative}
.tile::before{content:'';position:absolute;top:16px;right:16px;width:8px;height:8px;border-radius:50%;background:rgba(224,24,57,0.7)}
.tile small{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.18em;text-transform:uppercase;font-weight:500}
.snippet-scale-90 > div{transform:scale(0.9);transform-origin:center top}
.snippet-scale-80 > div{transform:scale(0.8);transform-origin:center top}
.brand-name{font-size:160px;font-weight:800;letter-spacing:-0.045em;line-height:0.95;background:linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.45) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;margin:0}
.brand-tag{margin-top:36px;font-size:32px;font-weight:500;line-height:1.3;color:rgba(255,255,255,0.78);max-width:900px;letter-spacing:-0.01em;margin-left:auto;margin-right:auto;text-wrap:balance}
</style></head>
<body>
<div class="stage">
  <div class="shotid">Shot ${shotNo} / 10</div>
  ${snippet ? `<div class="snippet ${snippet.scaleClass || ""}">${snippet.html}</div>` : ""}
  ${kickerBlock}
  <div class="brand"><span class="dot"></span>Design Workshop</div>
  <div class="progress"><div class="bar"></div></div>
</div></body></html>`;
}

// ---- Storyboard ---------------------------------------------------------
const SHOTS = [];

// 01 — Cold open / brand title
SHOTS.push({
  id: "01",
  duration: 3.0,
  custom: `<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@500&display=swap');
html,body{margin:0;padding:0;width:1920px;height:1080px;font-family:'Inter',sans-serif;color:#fff;background:radial-gradient(ellipse at 30% 20%,#1e293b 0%,#0b0f1a 60%,#020617 100%);overflow:hidden}
.stage{position:relative;width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 96px}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:500;letter-spacing:0.42em;text-transform:uppercase;color:#E01839;margin:0 0 56px}
.brand-name{font-size:200px;font-weight:800;letter-spacing:-0.05em;line-height:0.92;background:linear-gradient(135deg,#fff 35%,rgba(255,255,255,0.4) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;margin:0}
.brand-tag{margin-top:44px;font-size:36px;font-weight:500;line-height:1.3;color:rgba(255,255,255,0.82);max-width:1100px;letter-spacing:-0.01em;text-wrap:balance}
.shotid{position:absolute;top:48px;right:64px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.42);text-transform:uppercase}
.shotid::before{content:'';display:inline-block;width:14px;height:1px;background:#E01839;vertical-align:middle;margin-right:10px}
.dot-grid{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);background-size:36px 36px;mask-image:radial-gradient(ellipse at center,rgba(0,0,0,0.5) 0%,transparent 70%);-webkit-mask-image:radial-gradient(ellipse at center,rgba(0,0,0,0.5) 0%,transparent 70%);pointer-events:none}
.progress{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.06)}
.progress .bar{height:100%;background:#E01839;width:10%}
</style></head>
<body>
<div class="stage">
  <div class="shotid">Shot 01 / 10</div>
  <div class="dot-grid"></div>
  <p class="eyebrow">Design Workshop · 2026</p>
  <h1 class="brand-name">Design<br/>Workshop</h1>
  <p class="brand-tag">A modular section library for e-commerce content teams — paste-ready HTML, scoped CSS, zero runtime libraries.</p>
  <div class="progress"><div class="bar"></div></div>
</div></body></html>`,
});

// 02 — 23 composable sections — visual grid wall
const TILE_NAMES = [
  { n: "Hero", t: "01" },
  { n: "Split Banner", t: "02" },
  { n: "Featured Card", t: "03" },
  { n: "Welcome", t: "04" },
  { n: "Content", t: "05" },
  { n: "Product Carousel", t: "06" },
  { n: "Product Grid", t: "07" },
  { n: "Resources", t: "08" },
  { n: "Insights", t: "09" },
  { n: "Feature Grid", t: "10" },
  { n: "Trust Strip", t: "11" },
  { n: "Comparison Table", t: "12" },
  { n: "Stat Counter", t: "13" },
  { n: "Video Embed", t: "14" },
  { n: "Steps", t: "15" },
  { n: "Testimonials", t: "16" },
  { n: "FAQ", t: "17" },
  { n: "CTA Banner", t: "18" },
  { n: "Logo Strip", t: "19" },
  { n: "Break Banner", t: "20" },
  { n: "Tabs", t: "21" },
  { n: "Placeholder Grid", t: "22" },
  { n: "Rich Text", t: "23" },
];
SHOTS.push({
  id: "02",
  duration: 3.0,
  html: frameShell({
    shotNo: "02",
    label: "library",
    snippet: {
      html: `<div class="grid">${TILE_NAMES.map(
        (t) => `<div class="tile"><small>${t.t}</small>${t.n}</div>`
      ).join("")}</div>`,
    },
    scrim: "rgba(8,11,20,0.74)",
    kicker: "Twenty-three composable sections.",
    sub: "Every page is one snippet. No build step, no runtime libraries — just paste it in.",
  }),
});

// 03 — Hero section showcase
SHOTS.push({
  id: "03",
  duration: 4.0,
  html: frameShell({
    shotNo: "03",
    label: "hero",
    snippet: {
      html: hero.render({
        ...hero.defaults(),
        transition: "slide",
      }),
      scaleClass: "snippet-scale-90",
    },
    scrim: "linear-gradient(180deg,rgba(8,11,20,0.32) 0%,rgba(8,11,20,0.86) 80%)",
    align: "bottom left",
    kicker: "Hero — full-bleed media + slide carousel.",
    body: "Per-slide background, layout, gradient and mobile-specific colours. Looping infinite carousel out of the box.",
  }),
});

// 04 — Split Banner
SHOTS.push({
  id: "04",
  duration: 3.5,
  html: frameShell({
    shotNo: "04",
    label: "split",
    snippet: {
      html: splitBanner.render({
        ...splitBanner.defaults(),
        eyebrow: "Editorial workhorse",
        heading: "Split Banner with feature points.",
        subheading:
          "Big image on one side, panel on the other. Optional bulleted feature list inside the panel.",
        ctaText: "See it live",
        showPoints: true,
        points: [
          { id: "p1", icon: "zap", title: "Per-side image", body: "Image left or right." },
          { id: "p2", icon: "shield", title: "Brand-kit themed", body: "Colours, fonts, logo overlay." },
          { id: "p3", icon: "check", title: "Mobile centre toggle", body: "Phone-only centred text." },
        ],
      }),
      scaleClass: "snippet-scale-80",
    },
    scrim: "linear-gradient(180deg,rgba(8,11,20,0.18) 0%,rgba(8,11,20,0.88) 78%)",
    align: "bottom left",
    kicker: "Split Banner with feature points.",
    body: "Image and copy side-by-side, with an optional icon-bulleted point list inside the panel.",
  }),
});

// 05 — Stat Counter (the new section)
SHOTS.push({
  id: "05",
  duration: 3.5,
  html: frameShell({
    shotNo: "05",
    label: "stat-counter",
    snippet: {
      html: statCounter.render({
        ...statCounter.defaults(),
        animate: false, // freeze on final values for the still frame
      }),
      scaleClass: "snippet-scale-90",
    },
    scrim: "linear-gradient(180deg,rgba(8,11,20,0.16) 0%,rgba(8,11,20,0.86) 80%)",
    align: "bottom left",
    kicker: "Stat Counter — animated big numbers.",
    body: "Count-up on scroll into view. Respects prefers-reduced-motion. New this week.",
  }),
});

// 06 — Video Embed (the other new section)
SHOTS.push({
  id: "06",
  duration: 3.0,
  html: frameShell({
    shotNo: "06",
    label: "video-embed",
    snippet: {
      html: videoEmbed.render(videoEmbed.defaults()),
      scaleClass: "snippet-scale-80",
    },
    scrim: "linear-gradient(180deg,rgba(8,11,20,0.18) 0%,rgba(8,11,20,0.88) 78%)",
    align: "bottom left",
    kicker: "Video Embed — privacy-first lightbox.",
    body: "Nothing loads from YouTube or Vimeo until the user actually presses play. ESC closes. Focus restored.",
  }),
});

// 07 — Comparison Table
SHOTS.push({
  id: "07",
  duration: 3.0,
  html: frameShell({
    shotNo: "07",
    label: "comparison",
    snippet: {
      html: comparisonTable.render(comparisonTable.defaults()),
      scaleClass: "snippet-scale-80",
    },
    scrim: "linear-gradient(180deg,rgba(8,11,20,0.16) 0%,rgba(8,11,20,0.88) 78%)",
    align: "bottom left",
    kicker: "Comparison Table — high-converting B2B.",
    body: "Three columns, brand-logo header on the winning column, accent tint, closing line + CTA below.",
  }),
});

// 08 — Brand kit themes everything
SHOTS.push({
  id: "08",
  duration: 3.0,
  html: frameShell({
    shotNo: "08",
    label: "brand-kit",
    // Trust strip styled with two different brand kits side-by-side — shows
    // the "one source of truth" idea visually.
    snippet: {
      html: `<div style="display:grid;grid-template-columns:1fr 1fr;width:100%;height:100%;align-items:center;gap:24px;padding:120px 64px 240px;box-sizing:border-box">
<div style="border-radius:14px;overflow:hidden;background:#fff">${trustStrip.render({
        ...trustStrip.defaults(),
        bgColor: "#ffffff",
        textColor: "#0f172a",
        bodyColor: "#475569",
        accentColor: "#E01839",
        columns: 2,
        items: trustStrip.defaults().items.slice(0, 2),
        paddingTop: 30,
        paddingBottom: 30,
      })}</div>
<div style="border-radius:14px;overflow:hidden;background:#fff">${trustStrip.render({
        ...trustStrip.defaults(),
        bgColor: "#0f172a",
        textColor: "#ffffff",
        bodyColor: "#cbd5e1",
        accentColor: "#22d3ee",
        columns: 2,
        items: trustStrip.defaults().items.slice(0, 2),
        paddingTop: 30,
        paddingBottom: 30,
      })}</div>
</div>`,
    },
    scrim: "linear-gradient(180deg,rgba(8,11,20,0.0) 0%,rgba(8,11,20,0.88) 78%)",
    align: "bottom left",
    kicker: "One brand kit themes the whole library.",
    body: "Colours, fonts, logos, eyebrow style — set them once, every section follows.",
  }),
});

// 09 — Self-contained snippet (code block visual)
SHOTS.push({
  id: "09",
  duration: 2.5,
  custom: `<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
html,body{margin:0;padding:0;width:1920px;height:1080px;font-family:'Inter',sans-serif;color:#fff;background:radial-gradient(ellipse at 65% 30%,#1e293b 0%,#0b0f1a 60%,#020617 100%);overflow:hidden}
.stage{position:relative;width:1920px;height:1080px;display:grid;grid-template-columns:560px 1fr;gap:96px;padding:0 120px;align-items:center}
.kicker .eyebrow{font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:500;letter-spacing:0.38em;text-transform:uppercase;color:#E01839;margin:0 0 28px}
.kicker h1{font-size:76px;font-weight:700;line-height:1.06;letter-spacing:-0.025em;margin:0 0 28px;color:#fff;text-wrap:balance}
.kicker p{font-size:24px;line-height:1.55;color:rgba(255,255,255,0.78);margin:0 0 14px;text-wrap:balance}
.kicker .bullets{margin:42px 0 0;padding:0;display:flex;flex-direction:column;gap:18px;list-style:none}
.kicker .bullets li{display:flex;align-items:flex-start;gap:16px;font-size:22px;line-height:1.4;color:rgba(255,255,255,0.92)}
.kicker .bullets li::before{content:'';flex-shrink:0;width:12px;height:12px;border-radius:3px;margin-top:8px;background:#E01839;box-shadow:0 0 0 4px rgba(224,24,57,0.18)}
.code{position:relative;padding:36px 44px;background:rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:18px;backdrop-filter:blur(6px);box-shadow:0 40px 80px -20px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.04);font-family:'JetBrains Mono',monospace;font-size:18px;line-height:1.7;color:rgba(255,255,255,0.92);overflow:hidden}
.code::before{content:'';position:absolute;top:0;left:0;right:0;height:42px;background:rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.05)}
.code::after{content:'snippet.html';position:absolute;top:13px;left:120px;font-size:13px;color:rgba(255,255,255,0.55);letter-spacing:0.04em}
.code .dot{position:absolute;top:18px;width:11px;height:11px;border-radius:50%}
.code .dot.r{left:28px;background:#ff5f56}
.code .dot.y{left:48px;background:#ffbd2e}
.code .dot.g{left:68px;background:#27c93f}
.code pre{margin:50px 0 0;font:inherit;color:inherit;white-space:pre-wrap;word-wrap:break-word}
.tag{color:#fda4af}.attr{color:#fde68a}.str{color:#86efac}.kw{color:#93c5fd}.com{color:rgba(255,255,255,0.34);font-style:italic}
.shotid{position:absolute;top:48px;right:64px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.42);text-transform:uppercase}
.shotid::before{content:'';display:inline-block;width:14px;height:1px;background:#E01839;vertical-align:middle;margin-right:10px}
.brand{position:absolute;bottom:48px;left:120px;display:flex;align-items:center;gap:14px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.55);text-transform:uppercase}
.brand .dot{width:10px;height:10px;background:#E01839;border-radius:50%;box-shadow:0 0 0 4px rgba(224,24,57,0.18)}
.progress{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.06)}
.progress .bar{height:100%;background:#E01839;width:90%}
</style></head>
<body>
<div class="stage">
  <div class="shotid">Shot 09 / 10</div>
  <div class="kicker">
    <p class="eyebrow">paste &amp; ship</p>
    <h1>One paste. One snippet. Ship it.</h1>
    <p>Every section ships as a self-contained block of HTML, scoped CSS and an optional tiny IIFE — no React, no jQuery, no build step.</p>
    <ul class="bullets">
      <li>Scoped CSS via per-instance class</li>
      <li>XSS-hardened by default</li>
      <li>Works inside Nettailer, Shopify &amp; plain HTML</li>
    </ul>
  </div>
  <div class="code">
    <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
<pre><span class="com">&lt;!-- Design Workshop snippet — paste anywhere --&gt;</span>
<span class="tag">&lt;section</span> <span class="attr">class</span>=<span class="str">"ns-stat-counter ns-stat-a1b2c3"</span>
         <span class="attr">style</span>=<span class="str">"--ns-accent:#E01839;..."</span><span class="tag">&gt;</span>
  <span class="tag">&lt;ul</span> <span class="attr">class</span>=<span class="str">"ns-stat-list"</span><span class="tag">&gt;</span>
    <span class="tag">&lt;li&gt;&lt;div</span> <span class="attr">class</span>=<span class="str">"ns-stat-num"</span>
        <span class="attr">data-ns-target</span>=<span class="str">"23"</span><span class="tag">&gt;</span>23<span class="tag">&lt;/div&gt;</span>
        <span class="tag">&lt;h3&gt;</span>Sections<span class="tag">&lt;/h3&gt;&lt;/li&gt;</span>
    <span class="com">...</span>
  <span class="tag">&lt;/ul&gt;</span>
<span class="tag">&lt;/section&gt;</span>
<span class="tag">&lt;style&gt;</span>.ns-stat-a1b2c3 <span class="kw">{</span>...<span class="kw">}</span><span class="tag">&lt;/style&gt;</span>
<span class="tag">&lt;script&gt;</span><span class="kw">(function(){</span> ...count-up logic... <span class="kw">})()</span><span class="tag">&lt;/script&gt;</span></pre>
  </div>
  <div class="brand"><span class="dot"></span>Design Workshop</div>
  <div class="progress"><div class="bar"></div></div>
</div></body></html>`,
});

// 10 — Outro / CTA
SHOTS.push({
  id: "10",
  duration: 1.5,
  custom: `<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&family=JetBrains+Mono:wght@500&display=swap');
html,body{margin:0;padding:0;width:1920px;height:1080px;font-family:'Inter',sans-serif;color:#fff;background:linear-gradient(135deg,#1e293b 0%,#0b0f1a 50%,#020617 100%);overflow:hidden}
.stage{position:relative;width:1920px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 120px}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:16px;font-weight:500;letter-spacing:0.42em;text-transform:uppercase;color:#E01839;margin:0 0 48px}
.headline{font-size:140px;font-weight:800;letter-spacing:-0.045em;line-height:0.96;margin:0;color:#fff;text-wrap:balance}
.headline em{font-style:normal;background:linear-gradient(135deg,#E01839 0%,#fda4af 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{margin:44px auto 0;font-size:30px;font-weight:500;line-height:1.4;color:rgba(255,255,255,0.78);max-width:1100px;letter-spacing:-0.01em}
.cta{margin-top:60px;display:inline-flex;align-items:center;gap:18px;padding:22px 42px;background:#E01839;border-radius:99px;font-size:24px;font-weight:600;color:#fff;letter-spacing:-0.005em;box-shadow:0 24px 48px -16px rgba(224,24,57,0.55)}
.cta::after{content:'→';font-size:30px;line-height:1}
.dot-grid{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,0.06) 1.5px,transparent 1.5px);background-size:36px 36px;mask-image:radial-gradient(ellipse at center,rgba(0,0,0,0.5) 0%,transparent 70%);-webkit-mask-image:radial-gradient(ellipse at center,rgba(0,0,0,0.5) 0%,transparent 70%);pointer-events:none}
.shotid{position:absolute;top:48px;right:64px;font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.28em;color:rgba(255,255,255,0.42);text-transform:uppercase}
.shotid::before{content:'';display:inline-block;width:14px;height:1px;background:#E01839;vertical-align:middle;margin-right:10px}
.progress{position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,0.06)}
.progress .bar{height:100%;background:#E01839;width:100%}
</style></head>
<body>
<div class="stage">
  <div class="shotid">Shot 10 / 10</div>
  <div class="dot-grid"></div>
  <p class="eyebrow">Start building</p>
  <h1 class="headline">Build pages,<br/><em>not boilerplate.</em></h1>
  <p class="sub">23 composable sections. Hybrid Page Builder. Brand Kit. One paste-ready snippet per page.</p>
  <span class="cta">Design Workshop</span>
  <div class="progress"><div class="bar"></div></div>
</div></body></html>`,
});

// Write everything out.
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = [];
for (const s of SHOTS) {
  const file = path.join(OUT_DIR, `shot-${s.id}.html`);
  fs.writeFileSync(file, s.custom || s.html);
  manifest.push({ id: s.id, file, duration: s.duration });
}
fs.writeFileSync(
  path.join(OUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
const total = manifest.reduce((a, b) => a + b.duration, 0);
console.log(`Wrote ${manifest.length} shot HTML files (total ${total.toFixed(1)}s)`);
