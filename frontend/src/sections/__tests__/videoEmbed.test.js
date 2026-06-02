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
  { in: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "iframe", expectId: "dQw4w9WgXcQ", host: "youtube-nocookie.com" },
  { in: "https://youtu.be/dQw4w9WgXcQ", type: "iframe", expectId: "dQw4w9WgXcQ", host: "youtube-nocookie.com" },
  { in: "https://www.youtube.com/embed/dQw4w9WgXcQ", type: "iframe", expectId: "dQw4w9WgXcQ", host: "youtube-nocookie.com" },
  { in: "https://www.youtube.com/shorts/abcDEF12345", type: "iframe", expectId: "abcDEF12345", host: "youtube-nocookie.com" },
  { in: "https://youtube.com/watch?v=aqz-KE-bpKQ&list=PL123", type: "iframe", expectId: "aqz-KE-bpKQ", host: "youtube-nocookie.com" },
  { in: "https://vimeo.com/76979871", type: "iframe", expectId: "76979871", host: "player.vimeo.com" },
  { in: "https://player.vimeo.com/video/76979871", type: "iframe", expectId: "76979871", host: "player.vimeo.com" },
  // Direct video files — should route through HTML5 <video>, not iframe.
  { in: "https://content-forge-1039.preview.emergentagent.com/_dws_video/design-workshop-30s.mp4", type: "video", expectId: "design-workshop-30s.mp4", host: "content-forge" },
  { in: "https://cdn.example.com/path/foo.webm", type: "video", expectId: "foo.webm", host: "cdn.example.com" },
  { in: "https://cdn.example.com/path/foo.mp4?cache=123", type: "video", expectId: "foo.mp4", host: "cdn.example.com" },
];
for (const c of URL_CASES) {
  const out = parseVideoEmbed(c.in);
  expect(
    `parseVideoEmbed("${c.in}") returns { type: "${c.type}", src: …${c.expectId} }`,
    out && out.type === c.type && typeof out.src === "string" && out.src.includes(c.host) && out.src.includes(c.expectId)
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

// autoplay flag wiring (iframe path only — direct video files always
// honour the section's autoplay setting at injection time via the JS).
expect(
  "parseVideoEmbed defaults to autoplay=1 (iframe)",
  /autoplay=1/.test(parseVideoEmbed("https://youtu.be/abc12345678").src)
);
expect(
  "parseVideoEmbed honours { autoplay: false } (iframe)",
  /autoplay=0/.test(parseVideoEmbed("https://youtu.be/abc12345678", { autoplay: false }).src)
);

// ─── render() contract ──────────────────────────────────────────────
{
  const code = videoEmbed.render(videoEmbed.defaults());
  expect("default render emits the poster <button>", /<button[^>]*class="ns-video-poster"[^>]*data-ns-play/.test(code));
  expect("default render emits the play-icon span", /class="ns-video-play[^"]*"/.test(code));
  expect("default render emits the modal container", /class="ns-video-modal"[^>]*role="dialog"/.test(code));
  expect("default render emits the close button with aria-label",
    /class="ns-video-modal-close"[^>]*aria-label="Close video"/.test(code));
  expect("default render does NOT inject an <iframe>", !/<iframe/.test(code));
  expect("default render does NOT inject a <video>", !/<video/.test(code));
  expect("default render exposes the parsed embed URL via data-ns-embed", /data-ns-embed="https?:\/\/[^"]+"/.test(code));
  expect("default render exposes the embed type via data-ns-embed-type", /data-ns-embed-type="(iframe|video)"/.test(code));
}

// ─── default videoUrl is blank in defaults() — fallback fires inside render
{
  const d = videoEmbed.defaults();
  expect("defaults().videoUrl is empty string (form starts blank)",
    d.videoUrl === "");
  expect("defaults().posterImage is empty string (form starts blank)",
    d.posterImage === "");
}

// ─── render() with blank URL silently uses the bundled demo reel ────
{
  const code = videoEmbed.render(videoEmbed.defaults());
  expect('blank URL render uses data-ns-embed-type="video" (bundled MP4 fallback)',
    /data-ns-embed-type="video"/.test(code));
  expect("blank URL render's embed URL ends in .mp4 (bundled demo)",
    /data-ns-embed="[^"]+\.mp4[^"]*"/.test(code));
  expect("blank URL render still serves a poster image (bundled fallback)",
    /class="ns-video-poster-img" src="[^"]+\.(jpg|png|webp)/.test(code));
}

// ─── user-supplied URL overrides the bundled fallback ───────────────
{
  const code = videoEmbed.render({ ...videoEmbed.defaults(), videoUrl: "https://youtu.be/dQw4w9WgXcQ" });
  expect('user-supplied YouTube URL → data-ns-embed-type="iframe"',
    /data-ns-embed-type="iframe"/.test(code));
  expect("user-supplied YouTube URL → embed src uses youtube-nocookie",
    /data-ns-embed="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/.test(code));
}

// ─── whitespace-only URL falls back to bundled too ──────────────────
{
  const code = videoEmbed.render({ ...videoEmbed.defaults(), videoUrl: "   " });
  expect('whitespace-only URL → still falls back to bundled .mp4',
    /data-ns-embed="[^"]+\.mp4[^"]*"/.test(code));
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
  expect("JS builds <video> via createElement for direct files", code.includes('createElement("video")'));
  expect("JS builds <iframe> via createElement for YouTube/Vimeo", code.includes('createElement("iframe")'));
  expect("JS pauses the video on close", code.includes("existing.pause()"));
  expect("JS removes the player on close (frame.innerHTML = \"\")", code.includes('frame.innerHTML=""'));
  expect("JS locks body scroll on open", code.includes('document.body.style.overflow="hidden"'));
  expect("JS handles ESC key to close", /Escape|keyCode===27/.test(code));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
