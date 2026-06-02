/**
 * Video Embed — poster image with a centred play button that opens the
 * video in a modal lightbox on click.
 *
 * Privacy-friendly: the YouTube / Vimeo iframe is only injected the
 * moment the user clicks play. The poster image and play button cost
 * nothing extra on first paint.
 *
 * Accessibility: opening the modal moves focus to the close button,
 * ESC closes, click outside content closes, focus is restored to the
 * play button on close, body scroll is locked while open.
 *
 * Supported URL formats:
 *   • youtube.com/watch?v=ID         → youtube-nocookie.com/embed/ID
 *   • youtu.be/ID                    → youtube-nocookie.com/embed/ID
 *   • youtube.com/embed/ID           → youtube-nocookie.com/embed/ID
 *   • youtube.com/shorts/ID          → youtube-nocookie.com/embed/ID
 *   • vimeo.com/ID                   → player.vimeo.com/video/ID
 *   • player.vimeo.com/video/ID      → player.vimeo.com/video/ID
 */
import { PlayCircle } from "lucide-react";
import {
  baseReset,
  escAttr,
  escHtml,
  fullBleedClass,
  iife,
  makeUid,
  num,
  padTopOf,
  padBotOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  TextAreaField,
  SliderField,
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";

const ID = "video-embed";

/**
 * Parse a video URL into an embeddable source.
 *
 * Returns one of:
 *   { type: "iframe", src }  — YouTube / Vimeo (loaded into an <iframe>)
 *   { type: "video",  src }  — direct MP4 / WebM / Ogg (loaded into a <video>)
 *   null                     — unknown / unsafe URL; caller disables playback
 *
 * Pure, exported for unit tests.
 */
export function parseVideoEmbed(rawUrl, { autoplay = true } = {}) {
  if (!rawUrl) return null;
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  // Only http(s) — refuse javascript:, data:, file: etc.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./, "");
  const pathLower = url.pathname.toLowerCase();
  // ---- Direct video file (mp4 / webm / ogg / mov) ----
  // Detected by extension so a CDN-hosted MP4 (e.g. our own
  // /_dws_video/foo.mp4) plays via the HTML5 <video> element instead
  // of being incorrectly funnelled through a YouTube embed path.
  if (/\.(mp4|webm|ogg|ogv|mov)(?:$|\?)/.test(pathLower)) {
    return { type: "video", src: url.toString() };
  }
  // ---- YouTube ----
  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
    let id = url.searchParams.get("v");
    if (!id) {
      const m = url.pathname.match(/^\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{6,})/);
      if (m) id = m[1];
    }
    if (!id) return null;
    const ap = autoplay ? "1" : "0";
    return {
      type: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=${ap}&rel=0&modestbranding=1`,
    };
  }
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    if (!id) return null;
    const ap = autoplay ? "1" : "0";
    return {
      type: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=${ap}&rel=0&modestbranding=1`,
    };
  }
  // ---- Vimeo ----
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = url.pathname.match(/(?:\/video)?\/(\d+)/);
    if (!m) return null;
    const ap = autoplay ? "1" : "0";
    return {
      type: "iframe",
      src: `https://player.vimeo.com/video/${m[1]}?autoplay=${ap}&title=0&byline=0&portrait=0`,
    };
  }
  return null;
}

const defaults = () => ({
  uid: makeUid(),
  // Optional header above the player. Empty by default — many users
  // will drop this section in directly under another heading block.
  eyebrow: "Product tour",
  heading: "See it built in under five minutes",
  body:
    "Watch a Design Workshop snippet drop straight into a live e-commerce site — one paste, no build step, no runtime libraries, no broken styles.",
  // Poster image shown until the user clicks play. Defaults to the
  // first frame of the bundled Design Workshop product reel so the
  // section is "demo-ready" the moment it's added to a page.
  posterImage:
    "https://content-forge-1039.preview.emergentagent.com/_dws_video/poster.jpg",
  posterAlt: "Design Workshop product walkthrough",
  // Video URL — YouTube, Vimeo or a direct MP4/WebM/OGG file. Defaults
  // to the 30-second Design Workshop product reel hosted on the same
  // origin (so users see a real demo on first paste; they can swap it
  // for their own URL via the form panel).
  videoUrl:
    "https://content-forge-1039.preview.emergentagent.com/_dws_video/design-workshop-30s.mp4",
  // Aspect ratio of the modal player.
  aspect: "16/9", // "16/9" | "4/3" | "1/1" | "21/9"
  // Player width inside the modal — controls how big the lightbox feels.
  playerMaxWidth: 1100, // px
  // Autoplay the moment the lightbox opens. Default ON — that's the
  // whole point of a click-to-open lightbox.
  autoplay: true,
  // Layout
  alignment: "center", // "left" | "center"
  posterMaxWidth: 880, // px — width of the poster inline on the page
  posterAspect: "16/9", // mirror modal aspect by default; user can override
  fullBleed: false,
  paddingTop: 80,
  paddingBottom: 80,
  paddingY: 80, // legacy fallback
  // Theme
  bgColor: "#ffffff",
  textColor: "#0f172a",
  bodyColor: "#475569",
  accentColor: "#E01839", // eyebrow + play button accent
  // Play button styling.
  playButtonSize: 88, // px
  playButtonStyle: "solid", // "solid" | "outline"
  modalOverlayColor: "rgba(15,23,42,0.92)",
});

function render(cfg = {}) {
  const c = { ...defaults(), ...cfg };
  const uid = c.uid || makeUid();
  const cls = `ns-video-${uid}`;
  const align = c.alignment === "left" ? "left" : "center";
  const accent = safeColor(c.accentColor, "#E01839");
  const padTop = padTopOf(c, 80);
  const padBot = padBotOf(c, 80);
  const ASPECTS = { "16/9": "16/9", "4/3": "4/3", "1/1": "1/1", "21/9": "21/9" };
  const aspect = ASPECTS[c.aspect] || "16/9";
  const posterAspect = ASPECTS[c.posterAspect] || aspect;
  const playSize = num(c.playButtonSize, 88);
  const parsed = parseVideoEmbed(c.videoUrl, { autoplay: !!c.autoplay });
  const embedUrl = parsed ? parsed.src : "";
  const embedType = parsed ? parsed.type : "";

  // Header is only emitted when at least one field is filled, so users
  // can drop a Video Embed inline under another heading block without
  // forcing a duplicate header.
  const headerHtml =
    c.eyebrow || c.heading || c.body
      ? `<div class="ns-video-header">
      ${c.eyebrow ? `<p class="ns-video-eyebrow">${escHtml(c.eyebrow)}</p>` : ""}
      ${c.heading ? `<h2 class="ns-video-heading">${escHtml(c.heading)}</h2>` : ""}
      ${c.body ? `<p class="ns-video-body">${escHtml(c.body)}</p>` : ""}
    </div>`
      : "";

  const posterUrl = safeUrl(c.posterImage);
  const posterAlt = escAttr(c.posterAlt || c.heading || "Video poster");
  const playButtonClass =
    c.playButtonStyle === "outline" ? "ns-video-play is-outline" : "ns-video-play is-solid";

  // The poster button is the actual click target — wraps the whole
  // image so a tap anywhere on the poster opens the modal. Disabled
  // (with a visual hint) when we couldn't parse a valid embed URL so
  // we don't ship a broken lightbox.
  const posterButton = embedUrl
    ? `<button type="button" class="ns-video-poster" data-ns-play aria-label="${escAttr(
        c.heading ? `Play video: ${c.heading}` : "Play video"
      )}">
    ${posterUrl ? `<img class="ns-video-poster-img" src="${escAttr(posterUrl)}" alt="${posterAlt}" loading="lazy"/>` : `<div class="ns-video-poster-fallback" aria-hidden="true"></div>`}
    <span class="${playButtonClass}" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="${Math.round(playSize * 0.42)}" height="${Math.round(playSize * 0.42)}" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
    </span>
  </button>`
    : `<div class="ns-video-poster is-disabled" aria-disabled="true">
    ${posterUrl ? `<img class="ns-video-poster-img" src="${escAttr(posterUrl)}" alt="${posterAlt}" loading="lazy"/>` : `<div class="ns-video-poster-fallback" aria-hidden="true"></div>`}
    <span class="ns-video-poster-error">Add a YouTube or Vimeo URL to enable playback</span>
  </div>`;

  // Modal markup. Hidden until [data-ns-open=true] is set on the root.
  // The iframe slot is empty — the JS injects the iframe on open and
  // removes it on close so the video really stops (and doesn't keep
  // streaming bytes in the background).
  const modalHtml = `<div class="ns-video-modal" data-ns-modal role="dialog" aria-modal="true" aria-label="Video player">
    <div class="ns-video-modal-overlay" data-ns-close></div>
    <div class="ns-video-modal-content" role="document">
      <button type="button" class="ns-video-modal-close" data-ns-close aria-label="Close video">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
      <div class="ns-video-modal-frame" data-ns-frame></div>
    </div>
  </div>`;

  const styleVars = [
    `--ns-bg:${safeColor(c.bgColor, "#ffffff")}`,
    `--ns-text:${safeColor(c.textColor, "#0f172a")}`,
    `--ns-body:${safeColor(c.bodyColor, "#475569")}`,
    `--ns-accent:${accent}`,
    `--ns-overlay:${safeColor(c.modalOverlayColor, "rgba(15,23,42,0.92)")}`,
    `--ns-play-size:${playSize}px`,
    `--ns-poster-w:${num(c.posterMaxWidth, 880)}px`,
    `--ns-player-w:${num(c.playerMaxWidth, 1100)}px`,
    `--ns-aspect:${aspect.replace("/", " / ")}`,
    `--ns-poster-aspect:${posterAspect.replace("/", " / ")}`,
  ].join(";");

  const css = `
${baseReset(cls)}
.${cls}{padding:${padTop}px 20px ${padBot}px;width:100%;background:var(--ns-bg);color:var(--ns-text)}
.${cls} .ns-video-wrap{max-width:1200px;margin:0 auto;text-align:${align}}
.${cls} .ns-video-header{margin:0 auto 32px;max-width:680px;text-align:${align}}
.${cls} .ns-video-eyebrow{margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--ns-accent)}
.${cls} .ns-video-heading{margin:0 0 14px;font-size:clamp(1.6rem,3vw,2.25rem);font-weight:600;letter-spacing:-0.015em;line-height:1.15;color:var(--ns-text)}
.${cls} .ns-video-body{margin:0;font-size:16px;line-height:1.6;color:var(--ns-body)}
.${cls} .ns-video-poster{position:relative;display:block;width:100%;max-width:var(--ns-poster-w);margin:0 auto;padding:0;border:0;background:transparent;cursor:pointer;border-radius:12px;overflow:hidden;aspect-ratio:var(--ns-poster-aspect);box-shadow:0 24px 48px -16px rgba(15,23,42,0.35),0 8px 16px -8px rgba(15,23,42,0.18);transition:transform .25s ease,box-shadow .25s ease}
.${cls} .ns-video-poster:hover{transform:translateY(-2px);box-shadow:0 28px 56px -16px rgba(15,23,42,0.45),0 10px 20px -8px rgba(15,23,42,0.22)}
.${cls} .ns-video-poster:focus-visible{outline:3px solid var(--ns-accent);outline-offset:4px}
.${cls} .ns-video-poster.is-disabled{cursor:not-allowed;opacity:0.7;pointer-events:none}
.${cls} .ns-video-poster-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
.${cls} .ns-video-poster-fallback{position:absolute;inset:0;background:linear-gradient(135deg,#1e293b 0%,#475569 100%)}
.${cls} .ns-video-poster-error{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);background:rgba(15,23,42,0.85);color:#fff;font-size:12px;font-weight:600;padding:6px 12px;border-radius:6px;letter-spacing:0.02em}
.${cls} .ns-video-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:var(--ns-play-size);height:var(--ns-play-size);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;transition:transform .2s ease,filter .2s ease;pointer-events:none}
.${cls} .ns-video-play.is-solid{background:var(--ns-accent);color:#fff;box-shadow:0 12px 24px -8px rgba(0,0,0,0.4)}
.${cls} .ns-video-play.is-outline{background:rgba(255,255,255,0.92);color:var(--ns-accent);border:2px solid var(--ns-accent)}
.${cls} .ns-video-play svg{margin-left:6%}
.${cls} .ns-video-poster:hover .ns-video-play{transform:translate(-50%,-50%) scale(1.06);filter:brightness(1.05)}
/* Modal */
.${cls} .ns-video-modal{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;padding:24px;animation:ns-vm-fade-${uid} .18s ease-out}
.${cls}[data-ns-open="true"] .ns-video-modal{display:flex}
.${cls} .ns-video-modal-overlay{position:absolute;inset:0;background:var(--ns-overlay);cursor:pointer}
.${cls} .ns-video-modal-content{position:relative;width:100%;max-width:var(--ns-player-w);max-height:calc(100vh - 48px);display:flex;flex-direction:column;gap:12px}
.${cls} .ns-video-modal-close{align-self:flex-end;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,0.12);color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:background .15s ease,transform .15s ease;backdrop-filter:blur(8px)}
.${cls} .ns-video-modal-close:hover{background:rgba(255,255,255,0.22);transform:scale(1.05)}
.${cls} .ns-video-modal-close:focus-visible{outline:2px solid #fff;outline-offset:3px}
.${cls} .ns-video-modal-frame{position:relative;width:100%;aspect-ratio:var(--ns-aspect);background:#000;border-radius:8px;overflow:hidden;box-shadow:0 40px 80px -20px rgba(0,0,0,0.6)}
.${cls} .ns-video-modal-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block}
@keyframes ns-vm-fade-${uid}{from{opacity:0}to{opacity:1}}
@media (max-width:640px){
  .${cls} .ns-video-play{width:calc(var(--ns-play-size) * 0.72);height:calc(var(--ns-play-size) * 0.72)}
  .${cls} .ns-video-modal{padding:12px}
  .${cls} .ns-video-modal-close{width:36px;height:36px}
}
@media (prefers-reduced-motion: reduce){
  .${cls} .ns-video-poster,.${cls} .ns-video-play,.${cls} .ns-video-modal-close{transition:none}
  .${cls} .ns-video-modal{animation:none}
}
`.trim();

  const html = `<section class="ns-video-embed ${cls}${fullBleedClass(c)}" style="${styleVars}" data-ns-embed="${escAttr(
    embedUrl || ""
  )}" data-ns-embed-type="${escAttr(embedType || "")}">
  <div class="ns-video-wrap">
    ${headerHtml}
    ${posterButton}
  </div>
  ${modalHtml}
</section>`;

  // Click-to-open lightbox. Injects either an <iframe> (YouTube/Vimeo)
  // or an HTML5 <video controls autoplay> (direct mp4/webm/ogg) only on
  // open — so the third-party YouTube/Vimeo cookies & network requests
  // never happen until the user explicitly hits play. Removes the
  // element on close so the video really stops (no orphaned audio).
  // Focus management: stashes the previously-focused element, focuses
  // the close button on open, restores focus on close. ESC also closes.
  // Body scroll lock via document.body.style.overflow toggle.
  const js = iife(
    cls,
    `var embed=root.getAttribute("data-ns-embed");var kind=root.getAttribute("data-ns-embed-type");if(!embed)return;var openBtn=root.querySelector("[data-ns-play]");var modal=root.querySelector("[data-ns-modal]");var frame=root.querySelector("[data-ns-frame]");var closeEls=root.querySelectorAll("[data-ns-close]");var closeBtn=root.querySelector(".ns-video-modal-close");var lastFocus=null;var prevBodyOverflow="";var autoplay=${c.autoplay ? "true" : "false"};function buildPlayer(){if(kind==="video"){var v=document.createElement("video");v.setAttribute("src",embed);v.setAttribute("controls","");v.setAttribute("playsinline","");if(autoplay){v.setAttribute("autoplay","");v.muted=true;}v.style.width="100%";v.style.height="100%";v.style.display="block";v.style.background="#000";return v;}var ifr=document.createElement("iframe");ifr.setAttribute("src",embed);ifr.setAttribute("allow","autoplay; encrypted-media; fullscreen; picture-in-picture");ifr.setAttribute("allowfullscreen","");ifr.setAttribute("title","Video player");return ifr;}function open(){if(root.getAttribute("data-ns-open")==="true")return;lastFocus=document.activeElement;frame.innerHTML="";frame.appendChild(buildPlayer());root.setAttribute("data-ns-open","true");prevBodyOverflow=document.body.style.overflow;document.body.style.overflow="hidden";requestAnimationFrame(function(){if(closeBtn)closeBtn.focus();});document.addEventListener("keydown",onKey);}function close(){if(root.getAttribute("data-ns-open")!=="true")return;root.removeAttribute("data-ns-open");var existing=frame.querySelector("video");if(existing){try{existing.pause();}catch(e){}}frame.innerHTML="";document.body.style.overflow=prevBodyOverflow;document.removeEventListener("keydown",onKey);if(lastFocus&&typeof lastFocus.focus==="function"){try{lastFocus.focus();}catch(e){}}}function onKey(e){if(e.key==="Escape"||e.keyCode===27){e.preventDefault();close();}}if(openBtn)openBtn.addEventListener("click",function(e){e.preventDefault();open();});for(var i=0;i<closeEls.length;i++){closeEls[i].addEventListener("click",function(e){e.preventDefault();e.stopPropagation();close();});}`
  );

  return wrapSnippet({ html, css, js });
}

function FormPanel({ config, onUpdate }) {
  return (
    <FormAccordion sectionType="video-embed">
      <Group title="Header (optional)">
        <TextField
          label="Eyebrow"
          value={config.eyebrow || ""}
          onChange={(v) => onUpdate({ eyebrow: v })}
          testid="video-eyebrow"
        />
        <TextField
          label="Heading"
          value={config.heading || ""}
          onChange={(v) => onUpdate({ heading: v })}
          testid="video-heading"
        />
        <TextAreaField
          label="Body"
          value={config.body || ""}
          rows={3}
          onChange={(v) => onUpdate({ body: v })}
          testid="video-body"
        />
      </Group>

      <Group title="Video">
        <TextField
          label="Video URL (YouTube, Vimeo or direct MP4/WebM)"
          value={config.videoUrl || ""}
          onChange={(v) => onUpdate({ videoUrl: v })}
          placeholder="https://www.youtube.com/watch?v=…  or  https://…/video.mp4"
          testid="video-url"
        />
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Poster image
          </Label>
          <ImageUpload
            value={config.posterImage}
            onChange={(v) => onUpdate({ posterImage: v })}
            testid="video-poster"
          />
        </div>
        <TextField
          label="Poster alt text (optional)"
          value={config.posterAlt || ""}
          onChange={(v) => onUpdate({ posterAlt: v })}
          placeholder="Falls back to the heading"
          testid="video-poster-alt"
        />
        <ToggleField
          label="Autoplay when modal opens"
          description="Plays the moment the lightbox opens. Most browsers require muted autoplay — the user can unmute via the player controls."
          checked={!!config.autoplay}
          onChange={(v) => onUpdate({ autoplay: v })}
          testid="video-autoplay"
        />
      </Group>

      <Group title="Defaults" value="defaults">
        <SelectField
          label="Modal aspect ratio"
          value={config.aspect || "16/9"}
          onChange={(v) => onUpdate({ aspect: v })}
          options={[
            { value: "16/9", label: "16:9 (widescreen)" },
            { value: "4/3", label: "4:3 (classic)" },
            { value: "1/1", label: "1:1 (square)" },
            { value: "21/9", label: "21:9 (cinematic)" },
          ]}
          testid="video-aspect"
        />
        <SelectField
          label="Poster aspect ratio"
          value={config.posterAspect || "16/9"}
          onChange={(v) => onUpdate({ posterAspect: v })}
          options={[
            { value: "16/9", label: "16:9 (widescreen)" },
            { value: "4/3", label: "4:3 (classic)" },
            { value: "1/1", label: "1:1 (square)" },
            { value: "21/9", label: "21:9 (cinematic)" },
          ]}
          testid="video-poster-aspect"
        />
        <SliderField
          label="Poster max width"
          value={config.posterMaxWidth || 880}
          min={480}
          max={1280}
          step={20}
          suffix="px"
          onChange={(v) => onUpdate({ posterMaxWidth: v })}
          testid="video-poster-w"
        />
        <SliderField
          label="Lightbox max width"
          value={config.playerMaxWidth || 1100}
          min={640}
          max={1600}
          step={20}
          suffix="px"
          onChange={(v) => onUpdate({ playerMaxWidth: v })}
          testid="video-player-w"
        />
        <SelectField
          label="Alignment"
          value={config.alignment || "center"}
          onChange={(v) => onUpdate({ alignment: v })}
          options={[
            { value: "center", label: "Center" },
            { value: "left", label: "Left" },
          ]}
          testid="video-alignment"
        />
        <SelectField
          label="Play button style"
          value={config.playButtonStyle || "solid"}
          onChange={(v) => onUpdate({ playButtonStyle: v })}
          options={[
            { value: "solid", label: "Solid (filled accent)" },
            { value: "outline", label: "Outlined (white)" },
          ]}
          testid="video-play-style"
        />
        <SliderField
          label="Play button size"
          value={config.playButtonSize || 88}
          min={48}
          max={160}
          suffix="px"
          onChange={(v) => onUpdate({ playButtonSize: v })}
          testid="video-play-size"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={!!config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="video-full-bleed"
        />
        <PaddingFields
          config={config}
          onUpdate={onUpdate}
          defaultValue={80}
          min={20}
          max={160}
          testidPrefix="video"
        />
        <div className="pt-3 mt-1 border-t border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Theme</p>
        </div>
        <ColorField
          label="Background"
          value={config.bgColor}
          onChange={(v) => onUpdate({ bgColor: v })}
          testid="video-bg"
        />
        <ColorField
          label="Heading colour"
          value={config.textColor}
          onChange={(v) => onUpdate({ textColor: v })}
          testid="video-text"
        />
        <ColorField
          label="Body colour"
          value={config.bodyColor}
          onChange={(v) => onUpdate({ bodyColor: v })}
          testid="video-body-color"
        />
        <ColorField
          label="Accent (eyebrow + play button)"
          value={config.accentColor}
          onChange={(v) => onUpdate({ accentColor: v })}
          testid="video-accent"
        />
        <ColorField
          label="Modal overlay colour"
          value={config.modalOverlayColor}
          onChange={(v) => onUpdate({ modalOverlayColor: v })}
          testid="video-overlay"
        />
      </Group>
    </FormAccordion>
  );
}

export const videoEmbed = {
  id: ID,
  name: "Video Embed",
  description: "Poster image + click-to-play lightbox (YouTube / Vimeo)",
  icon: PlayCircle,
  defaults,
  render,
  FormPanel,
};
