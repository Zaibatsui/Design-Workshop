/**
 * Smoke test for the new "Story page" template.
 *
 *   • PAGE_TEMPLATES contains a `story-page` entry.
 *   • The template ships exactly 5 blocks in the expected narrative order:
 *     hero → video-embed → stat-counter → trust-strip → cta-banner.
 *   • Each block's config is wired correctly (e.g. cta-banner is in
 *     email-form mode; video-embed has its bundled-demo fallback).
 *   • Every block renders to a non-empty HTML snippet — proves the
 *     end-to-end "click template → get a working page" contract.
 *
 * Run with: node src/sections/__tests__/storyPage.template.test.js
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");
const babel = require("@babel/core");

const SRC_ROOT = path.resolve(__dirname, "../..");

function transformFile(filePath) {
  return babel.transformSync(fs.readFileSync(filePath, "utf8"), {
    filename: filePath,
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
  "@/components/BlogPagePicker",
  "@/components/FormGroup",
  "@/components/RichTextEditor",
  "lucide-react",
]);
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
  // All shadcn ui primitives — too many to enumerate individually.
  if (request.startsWith("@/components/ui/")) return require.resolve("./_hero_stub.js");
  if (request.startsWith("@/")) return path.join(SRC_ROOT, request.slice(2)) + ".js";
  return origResolve.call(this, request, parent, ...rest);
};
const stubPath = path.join(__dirname, "_hero_stub.js");
if (!fs.existsSync(stubPath)) {
  fs.writeFileSync(stubPath, "module.exports = new Proxy({}, { get: () => () => null });\n");
}
const origJsExt = require.extensions[".js"];
require.extensions[".js"] = function (module, filename) {
  if (!filename.startsWith(SRC_ROOT)) return origJsExt(module, filename);
  module._compile(transformFile(filename), filename);
};

const { PAGE_TEMPLATES, PAGE_TEMPLATES_BY_ID } = require("../pageTemplates.js");
const { SECTIONS_BY_ID } = require("../registry.js");
const { templateMetaFor } = require("../pageTemplateMeta.js");

let passed = 0;
let failed = 0;
function expect(label, cond, extra = "") {
  if (cond) {
    console.log(`PASS \u00b7 ${label}`);
    passed++;
  } else {
    console.log(`FAIL \u00b7 ${label}${extra ? "\n   " + extra : ""}`);
    failed++;
  }
}

// ─── Template registration ───────────────────────────────────────────
const tmpl = PAGE_TEMPLATES_BY_ID["story-page"];
expect("PAGE_TEMPLATES_BY_ID has 'story-page'", !!tmpl);
expect("Story page surfaces a human-readable name",
  tmpl && typeof tmpl.name === "string" && tmpl.name.length > 0);
expect("Story page surfaces a description",
  tmpl && typeof tmpl.description === "string" && tmpl.description.length > 20);

// ─── Block sequence ──────────────────────────────────────────────────
const EXPECTED_SEQ = ["hero", "video-embed", "stat-counter", "trust-strip", "cta-banner"];
expect("Story page contains exactly 5 blocks",
  tmpl && Array.isArray(tmpl.blocks) && tmpl.blocks.length === 5);
expect(
  `Story page block sequence === ${EXPECTED_SEQ.join(" → ")}`,
  tmpl && tmpl.blocks.every((b, i) => b.section_type === EXPECTED_SEQ[i])
);

// ─── Per-block config wiring ─────────────────────────────────────────
const byType = Object.fromEntries(
  tmpl.blocks.map((b) => [b.section_type, b.config])
);

// Hero: single slide with the dark photo backdrop + primary CTA
expect("hero block ships a single slide",
  byType.hero && Array.isArray(byType.hero.slides) && byType.hero.slides.length === 1);
expect("hero block uses Hero's native slide schema (title / subtitle / ctaText / ctaLink)",
  byType.hero &&
    typeof byType.hero.slides[0].title === "string" &&
    typeof byType.hero.slides[0].subtitle === "string" &&
    typeof byType.hero.slides[0].ctaText === "string" &&
    typeof byType.hero.slides[0].ctaLink === "string");
expect("hero block has a primary CTA",
  typeof byType.hero.slides[0].ctaText === "string" && byType.hero.slides[0].ctaText.length > 0);

// Video Embed: empty videoUrl so bundled demo plays silently
expect("video-embed leaves videoUrl blank (bundled demo fallback fires)",
  byType["video-embed"].videoUrl === "");
expect("video-embed sets a dark theme to flow into the stat-counter",
  /^#0f172a$/i.test(byType["video-embed"].bgColor || ""));

// Stat Counter: uses Design-Workshop-friendly defaults
expect("stat-counter has an eyebrow describing impact",
  typeof byType["stat-counter"].eyebrow === "string" && byType["stat-counter"].eyebrow.length > 0);

// Trust Strip: 4 columns, 4 items, light theme
expect("trust-strip ships 4 columns of 4 items",
  byType["trust-strip"].columns === 4 && byType["trust-strip"].items.length === 4);
expect("trust-strip uses a light theme for visual contrast",
  /^#ffffff$/i.test(byType["trust-strip"].bgColor || ""));

// CTA Banner: ships with the bundled Jotform URL as a single button.
expect('cta-banner is in mode="buttons"',
  byType["cta-banner"].mode === "buttons");
expect("cta-banner primaryUrl is the bundled Jotform link",
  byType["cta-banner"].primaryUrl ===
    "https://form.jotform.com/261525245636054");
expect("cta-banner primary button opens in a new tab (host site stays put)",
  byType["cta-banner"].primaryOpenInSameTab === false);
expect("cta-banner secondary button is hidden by default",
  byType["cta-banner"].showSecondary === false);

// ─── End-to-end render contract ──────────────────────────────────────
for (const block of tmpl.blocks) {
  const def = SECTIONS_BY_ID[block.section_type];
  expect(`SECTIONS_BY_ID has "${block.section_type}"`, !!def);
  if (!def) continue;
  let html;
  try {
    html = def.render({ ...def.defaults(), ...block.config });
  } catch (e) {
    expect(`${block.section_type}.render() does not throw`, false, String(e));
    continue;
  }
  expect(
    `${block.section_type}.render() returns a non-empty snippet`,
    typeof html === "string" && html.length > 100
  );
}

// ─── Template metadata ───────────────────────────────────────────────
const meta = templateMetaFor("story-page");
expect("templateMetaFor('story-page') returns its shipped addedOn (2026-01-28)",
  meta && typeof meta.addedOn === "string" && meta.addedOn.startsWith("2026-01-28"));
expect("templateMetaFor('story-page') returns a whatsNew line",
  meta && typeof meta.whatsNew === "string" && meta.whatsNew.length > 30);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
