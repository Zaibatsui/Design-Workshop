/**
 * Unit tests for the Video Embed section.
 *
 *   • parseVideoEmbed() converts every supported URL shape (youtube.com,
 *     youtu.be, youtube embed, shorts, vimeo) to a privacy-friendly
 *     embed URL. Unknown hosts return null so we never inject a broken
 *     iframe into the snippet.
 *   • Default render() emits the poster <button>, the play-icon span and
 *     the modal markup, but NOT an <iframe>. The iframe is only injected
 *     by the IIFE on click — confirms the privacy / lazy-load contract.
 *   • A garbage URL renders the disabled poster placeholder and omits
 *     [data-ns-play] so the click handler can't fire.
 *
 * Run with: node src/sections/__tests__/videoEmbed.test.js
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
  "@/components/ui/label",
  "@/components/FormGroup",
  "lucide-react",
]);
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (STUBS.has(request)) return require.resolve("./_hero_stub.js");
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

const { videoEmbed, parseVideoEmbed } = require("../videoEmbed.js");

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

// ─── parseVideoEmbed ─────────────────────────────────────────────────
const URL_CASES = [
  { in: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expectId: "dQw4w9WgXcQ", host: "youtube-nocookie.com" },
  { in: "https://youtu.be/dQw4w9WgXcQ", expectId: "dQw4w9WgXcQ", host: "youtube-nocookie.com" },
  { in: "https://www.youtube.com/embed/dQw4w9WgXcQ", expectId: "dQw4w9WgXcQ", host: "youtube-nocookie.com" },
  { in: "https://www.youtube.com/shorts/abcDEF12345", expectId: "abcDEF12345", host: "youtube-nocookie.com" },
  { in: "https://youtube.com/watch?v=aqz-KE-bpKQ&list=PL123", expectId: "aqz-KE-bpKQ", host: "youtube-nocookie.com" },
  { in: "https://vimeo.com/76979871", expectId: "76979871", host: "player.vimeo.com" },
  { in: "https://player.vimeo.com/video/76979871", expectId: "76979871", host: "player.vimeo.com" },
];
for (const c of URL_CASES) {
  const out = parseVideoEmbed(c.in);
  expect(
    `parseVideoEmbed("${c.in}") returns ${c.host} URL with id ${c.expectId}`,
    typeof out === "string" && out.includes(c.host) && out.includes(c.expectId)
  );
}

const BAD_URLS = [
  "",
  null,
  undefined,
  "not a url",
  "https://example.com/foo",
  "https://www.youtube.com/",
  "javascript:alert(1)",
];
for (const u of BAD_URLS) {
  expect(`parseVideoEmbed(${JSON.stringify(u)}) returns null`, parseVideoEmbed(u) === null);
}

// autoplay flag wiring
expect(
  "parseVideoEmbed defaults to autoplay=1",
  /autoplay=1/.test(parseVideoEmbed("https://youtu.be/abc12345678"))
);
expect(
  "parseVideoEmbed honours { autoplay: false }",
  /autoplay=0/.test(parseVideoEmbed("https://youtu.be/abc12345678", { autoplay: false }))
);

// ─── render() contract ──────────────────────────────────────────────
{
  const code = videoEmbed.render(videoEmbed.defaults());
  expect("default render emits the poster <button>", /<button[^>]*class="ns-video-poster"[^>]*data-ns-play/.test(code));
  expect("default render emits the play-icon span", /class="ns-video-play[^"]*"/.test(code));
  expect("default render emits the modal container", /class="ns-video-modal"[^>]*role="dialog"/.test(code));
  expect("default render emits the close button with aria-label", /data-ns-close[^>]*aria-label="Close video"|aria-label="Close video"[^>]*data-ns-close/.test(code) ||
    /class="ns-video-modal-close"[^>]*aria-label="Close video"/.test(code));
  expect("default render does NOT inject an <iframe>", !/<iframe/.test(code));
  expect("default render exposes the parsed embed URL via data-ns-embed", /data-ns-embed="https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]+\?autoplay=1/.test(code));
  expect("default render uses youtube-nocookie host (privacy-friendly)", code.includes("youtube-nocookie.com"));
}

// ─── render() with a broken URL ─────────────────────────────────────
{
  const code = videoEmbed.render({ ...videoEmbed.defaults(), videoUrl: "not-a-real-url" });
  expect("broken URL → poster button has no data-ns-play attribute", !/<button[^>]*data-ns-play/.test(code));
  expect("broken URL → data-ns-embed is empty", /data-ns-embed=""/.test(code));
  expect("broken URL → user-facing error hint is shown", /Add a YouTube or Vimeo URL/.test(code));
}

// ─── JS bundle sanity ───────────────────────────────────────────────
{
  const code = videoEmbed.render(videoEmbed.defaults());
  expect("JS injects iframe via createElement on click", code.includes('createElement("iframe")'));
  expect("JS removes iframe on close (frame.innerHTML = \"\")", code.includes('frame.innerHTML=""'));
  expect("JS locks body scroll on open", code.includes('document.body.style.overflow="hidden"'));
  expect("JS handles ESC key to close", /Escape|keyCode===27/.test(code));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
