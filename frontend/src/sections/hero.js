/**
 * Hero Carousel — single unified hero with transition switch (slide / fade).
 * Replaces the old hero-slide.js and hero-fade.js.
 */
import { useEffect, useState } from "react";
import { GalleryHorizontalEnd } from "lucide-react";
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
  padXOf,
  safeColor,
  safeUrl,
  wrapSnippet,
} from "./shared";
import {
  TextField,
  TextAreaField,
  SliderField,
  ToggleField,
  SelectField,
} from "@/components/FormFields";
import ColorField from "@/components/ColorField";
import ImageUpload from "@/components/ImageUpload";
import ListEditor from "@/components/ListEditor";
import { Label } from "@/components/ui/label";

import { FormAccordion, FormGroup as Group } from "@/components/FormGroup";
import PaddingFields from "@/components/PaddingFields";
const ID = "hero";

const defaults = () => ({
  uid: makeUid(),
  transition: "slide",
  theme: {
    ctaBg: "#E01839",
    ctaText: "#ffffff",
    titleColor: "#ffffff",
    subtitleColor: "#f1f5f9",
    overlayColor: "#000000",
    overlayOpacity: 0.4,
    // Overlay model. `overlayType` controls the shaded layer behind
    // slide copy:
    //   "default"  — keep the legacy look (slide transition: hard-
    //                coded left-to-right dark gradient; fade: solid
    //                `overlayColor` × `overlayOpacity`). Preserves the
    //                look of every pre-overlay-controls section.
    //   "solid"    — uniform `overlayColor` at `overlayOpacity`.
    //   "gradient" — linear gradient between `overlayGradientFrom`
    //                and `overlayGradientTo` at `overlayGradientAngle`,
    //                tinted to `overlayOpacity`.
    overlayType: "default",
    overlayGradientFrom: "#000000",
    overlayGradientTo: "rgba(0,0,0,0)",
    overlayGradientAngle: 90,
    // Mobile overlay overrides. `overlayTypeMobile` "" inherits the
    // desktop overlay verbatim; any other value swaps the overlay
    // under (max-width:767px). Each field falls back to its desktop
    // counterpart if blank, so users can override just opacity (for
    // example) without re-setting colours.
    overlayTypeMobile: "",
    overlayColorMobile: "",
    overlayOpacityMobile: null,
    overlayGradientFromMobile: "",
    overlayGradientToMobile: "",
    overlayGradientAngleMobile: null,
    // Split-only fields (applied to every slide that opts into the
    // "split" layout — see slide.layout). Theme is global so a single
    // carousel doesn't visually flicker between two different brand
    // palettes when switching slides. Defaults track DEFAULT_BRAND_KIT
    // secondary/primary; Brand Kit overlays them on new section
    // creation via `applyToHero`.
    panelBgType: "solid", // "solid" | "gradient"
    panelBg: "#1f2937",
    panelGradientFrom: "#E01839",
    panelGradientTo: "#1f2937",
    panelGradientAngle: 135,
    // Mobile-only split-panel background overrides. When
    // `panelBgTypeMobile` is "" the panel inherits the desktop
    // background. Otherwise these fields drive a different look
    // under (max-width:767px) — applied via CSS variables so the
    // host site's responsive context (e.g. window resize) updates
    // live without a page reload.
    panelBgTypeMobile: "", // "" | "solid" | "gradient"
    panelBgMobile: "",
    panelGradientFromMobile: "",
    panelGradientToMobile: "",
    panelGradientAngleMobile: null,
  },
  layout: {
    height: 520,
    // Outer spacing (external whitespace above/below this section)
    paddingTop: 0,
    paddingBottom: 0,
    contentMaxWidth: 1200,
    textAlign: "left",
    // "" = inherit the desktop alignment on mobile. When set to
    // "center" the section root gets `.is-mobile-center` which
    // centres every element (logo, title, subtitle, CTA, and the
    // split-panel inner content) under (max-width:767px).
    textAlignMobile: "",
    borderRadius: 0,
    // Mobile layout overrides. The toggle gates visibility AND CSS
    // emission: when `mobileLayoutOverride` is false (default),
    // mobile inherits every desktop value verbatim and none of the
    // *Mobile fields below are used by the renderer. Flip the toggle
    // and individual fields can be edited; any field left `null`
    // still inherits its desktop counterpart so users can override
    // just height (for example) without re-setting the rest.
    mobileLayoutOverride: false,
    heightMobile: null,
    contentMaxWidthMobile: null,
    borderRadiusMobile: null,
    // Split-only layout (global across all split slides for visual
    // consistency).
    imageSide: "right", // "left" | "right"
    panelRatio: 50, // 40 | 50 | 60 — % width of the panel column
    // Vertical gap between the image and the coloured panel on
    // mobile (split-panel slides only). Desktop stays edge-to-edge.
    mobileImagePanelGap: 0,
  },
  settings: {
    autoplay: true,
    interval: 4000,
    pauseOnHover: true,
    // `showArrows` is the legacy on/off toggle; we now derive
    // visibility from `arrowsVisibility` which adds per-breakpoint
    // control. Old sections without `arrowsVisibility` are
    // back-compat: render-time inference treats `showArrows:false`
    // as "never" and `showArrows:true` as "always".
    showArrows: true,
    arrowsVisibility: "always", // "always" | "desktop" | "mobile" | "never"
    showDots: true,
  },
  fullBleed: false,
  slides: [
    {
      id: makeUid(),
      logo: "",
      logoAlt: "",
      title: "Tailor-made eCommerce solutions",
      subtitle: "Built for IT and telecom retailers ready to scale online.",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
      ctaText: "Book a demo",
      ctaLink: "#",
    },
    {
      id: makeUid(),
      logo: "",
      logoAlt: "",
      title: "Ready in no time",
      subtitle: "Launch your B2B web shop fast — and grow without limits.",
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
      ctaText: "Read more",
      ctaLink: "#",
    },
    {
      id: makeUid(),
      logo: "",
      logoAlt: "",
      title: "Enterprise-grade, customer-first",
      subtitle: "Advanced features for medium and large IT & telecom resellers.",
      image:
        "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
      ctaText: "Learn more",
      ctaLink: "#",
    },
  ],
});

// ──────────────────────────────────────────────────────────────────────
// Split-slide helpers.
//
// When `cfg.slideLayout === "split"`, each slide is rendered as a 2-col
// block: image on one side, brand panel on the other. The carousel
// outer mechanics (track + transitions + autoplay + arrows + dots) are
// untouched — only the inner slide markup + extra CSS differs.
//
// Full-bleed alignment trick: when the section sits at 100vw, the panel
// column's OUTER edge gets a calc-based gutter so its inner content
// lines up with where the host site's centred content column would
// start/end. Prevents headings drifting to the far viewport edge on
// wide monitors. Mirrors the standalone Split Banner section's logic.
//
// Panel background resolution:
//   - Per-slide overrides (slide.panelBgType, slide.panelBg, ...) win
//     when set.
//   - Otherwise the section-level theme (cfg.theme.panelBg*) is used.
//   - Applied as INLINE style on the `.ns-panel` element so each slide
//     can carry a different background without proliferating CSS rules.
// ──────────────────────────────────────────────────────────────────────
function slidePanelBackground(slide, cfg) {
  const t = cfg.theme || {};
  // Per-slide override wins if the user picked an explicit type.
  const useSlide = slide.panelBgType === "solid" || slide.panelBgType === "gradient";
  const type = useSlide ? slide.panelBgType : t.panelBgType || "solid";
  if (type === "gradient") {
    const angle = useSlide
      ? num(slide.panelGradientAngle, num(t.panelGradientAngle, 135))
      : num(t.panelGradientAngle, 135);
    const from = useSlide && slide.panelGradientFrom
      ? safeColor(slide.panelGradientFrom, "#E01839")
      : safeColor(t.panelGradientFrom, "#E01839");
    const to = useSlide && slide.panelGradientTo
      ? safeColor(slide.panelGradientTo, "#1f2937")
      : safeColor(t.panelGradientTo, "#1f2937");
    return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
  }
  // Solid
  if (useSlide && slide.panelBg) return safeColor(slide.panelBg, "#1f2937");
  return safeColor(t.panelBg, "#1f2937");
}

// Mobile panel background override (split-only). Returns the CSS
// background value for the panel under (max-width:767px) when
// either the slide or the section has `panelBgTypeMobile` set,
// otherwise `null` (= inherit desktop). Per-slide values win over
// section values; missing per-slide colour fields fall back to the
// slide's desktop colours, then to the section's mobile colours,
// then to section desktop. This is the same nesting pattern used
// for desktop panel BG and overlay overrides.
function slidePanelBackgroundMobile(slide, cfg) {
  const t = cfg.theme || {};
  // Slide overrides come first so a single slide can be "different
  // on mobile" without touching the section default.
  const useSlide = !!slide && !!slide.panelBgTypeMobile;
  const type = useSlide ? slide.panelBgTypeMobile : t.panelBgTypeMobile;
  if (type !== "solid" && type !== "gradient") return null;
  if (type === "gradient") {
    const angle = num(
      useSlide ? slide.panelGradientAngleMobile : t.panelGradientAngleMobile,
      num(
        useSlide ? slide.panelGradientAngle : t.panelGradientAngle,
        135
      )
    );
    const from = safeColor(
      (useSlide && slide.panelGradientFromMobile) ||
        t.panelGradientFromMobile ||
        (useSlide && slide.panelGradientFrom) ||
        t.panelGradientFrom,
      "#E01839"
    );
    const to = safeColor(
      (useSlide && slide.panelGradientToMobile) ||
        t.panelGradientToMobile ||
        (useSlide && slide.panelGradientTo) ||
        t.panelGradientTo,
      "#1f2937"
    );
    return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
  }
  return safeColor(
    (useSlide && slide.panelBgMobile) ||
      t.panelBgMobile ||
      (useSlide && slide.panelBg) ||
      t.panelBg,
    "#1f2937"
  );
}

// Resolve per-slide CTA button colours. Override fields on the slide
// take precedence; otherwise the section theme is used. Returns an
// inline `style="..."` attribute fragment (with leading space) or "".
function slideCtaStyle(slide, cfg) {
  if (!slide.ctaOverrideColors) return "";
  const t = cfg.theme || {};
  const bg = safeColor(slide.ctaBgColor || t.ctaBg, "#1f2937");
  const fg = safeColor(slide.ctaTextColor || t.ctaText, "#ffffff");
  return ` style="background:${bg};color:${fg}"`;
}

// Per-slide copy colour helpers. Each slide may carry its own
// `titleColor`, `subtitleColor`, and `eyebrowColor` to support
// carousels with mixed light + dark backgrounds (e.g. a slide on a
// pale photo needs near-black text; an adjacent slide on a dark
// product shot needs white text). When a field is blank/undefined
// the colour inherits from the section theme via CSS variables, so
// existing snippets render byte-identically.
function slideTitleStyle(slide) {
  const c = (slide && slide.titleColor || "").trim();
  return c ? ` style="color:${safeColor(c, "#ffffff")}"` : "";
}
function slideSubtitleStyle(slide) {
  const c = (slide && slide.subtitleColor || "").trim();
  return c ? ` style="color:${safeColor(c, "#ffffff")}"` : "";
}
function slideEyebrowStyle(slide, t) {
  const c =
    (slide && slide.eyebrowColor || "").trim() ||
    (t && t.eyebrowColor || "").trim();
  return c ? ` style="color:${safeColor(c, "#ffffff")}"` : "";
}
// Render the per-slide eyebrow above the title. Empty string when
// the slide has no eyebrow text (back-compat: no extra DOM emitted).
function slideEyebrowHtml(slide, t) {
  const eb = (slide && slide.eyebrow || "").trim();
  if (!eb) return "";
  return `<p class="ns-eyebrow"${slideEyebrowStyle(slide, t)}>${escHtml(eb)}</p>`;
}

// ──────────────────────────────────────────────────────────────────────
// Overlay resolver. Returns { bg, opacity } for the dark shaded layer
// behind slide copy.
//
//   type "default"  — preserves the look the section had before the
//                     overlay controls existed:
//                       • slide transition → hard-coded
//                         left-to-right dark gradient at full opacity
//                       • fade transition  → solid `overlayColor` at
//                         `overlayOpacity`
//   type "solid"    — uniform `overlayColor` at `overlayOpacity`.
//   type "gradient" — linear gradient between `gradientFrom` and
//                     `gradientTo` at `angle`, tinted to `opacity`.
//
// `transition` is "slide" or "fade" — only matters for "default" so
// each transition picks its legacy look.
// ──────────────────────────────────────────────────────────────────────
function resolveOverlay(theme, transition) {
  const t = theme || {};
  const type = t.overlayType || "default";
  const opacity = num(t.overlayOpacity, 0.5);
  if (type === "gradient") {
    const angle = num(t.overlayGradientAngle, 90);
    const from = safeColor(t.overlayGradientFrom || "#000000", "#000000");
    const to = safeColor(t.overlayGradientTo || "rgba(0,0,0,0)", "#000000");
    return {
      bg: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`,
      opacity,
    };
  }
  if (type === "solid") {
    return { bg: safeColor(t.overlayColor || "#000000", "#000000"), opacity };
  }
  // "default" — transition-aware legacy look.
  if (transition === "slide") {
    return {
      bg:
        "linear-gradient(90deg,rgba(0,0,0,.75) 0%,rgba(0,0,0,.55) 25%,rgba(0,0,0,.25) 50%,rgba(0,0,0,0) 75%)",
      opacity: 1,
    };
  }
  return { bg: safeColor(t.overlayColor || "#000000", "#000000"), opacity };
}

// Mobile overlay override. Returns `{ bg, opacity }` (each may be null
// to inherit the desktop value), or `null` when no mobile-specific
// overlay is configured. Empty-string colour fields and `null`/empty
// numerics fall back to the desktop equivalent so users can override
// just one axis (e.g. opacity-only) without re-entering colours.
function resolveOverlayMobile(theme, transition) {
  const t = theme || {};
  const typeM = t.overlayTypeMobile;
  if (!typeM) return null;
  const desktop = resolveOverlay(t, transition);
  const opacityM =
    t.overlayOpacityMobile == null || t.overlayOpacityMobile === ""
      ? desktop.opacity
      : num(t.overlayOpacityMobile, desktop.opacity);
  if (typeM === "gradient") {
    const angle = num(
      t.overlayGradientAngleMobile == null ? t.overlayGradientAngle : t.overlayGradientAngleMobile,
      90
    );
    const from = safeColor(
      t.overlayGradientFromMobile || t.overlayGradientFrom || "#000000",
      "#000000"
    );
    const to = safeColor(
      t.overlayGradientToMobile || t.overlayGradientTo || "rgba(0,0,0,0)",
      "#000000"
    );
    return {
      bg: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`,
      opacity: opacityM,
    };
  }
  if (typeM === "solid") {
    return {
      bg: safeColor(t.overlayColorMobile || t.overlayColor || "#000000", "#000000"),
      opacity: opacityM,
    };
  }
  // typeM === "default" → same resolution as desktop, but lets the
  // user keep mobile opacity distinct.
  return { bg: desktop.bg, opacity: opacityM };
}

// Mobile layout overrides. When `layout.mobileLayoutOverride` is on,
// we emit `--ns-*-m` custom properties for any per-axis override the
// user has dialled in. Returns an array of CSS-variable assignments
// (each a string like "--ns-height-m:480px"); empty array means no
// mobile vars to emit, so the @media rule's `var(--*, var(--*))`
// fallback keeps the desktop value live.
function mobileLayoutVars(layout) {
  const l = layout || {};
  if (!l.mobileLayoutOverride) return [];
  const out = [];
  if (l.heightMobile != null && l.heightMobile !== "") {
    out.push(`--ns-height-m:${num(l.heightMobile, num(l.height, 520))}px`);
  }
  if (l.contentMaxWidthMobile != null && l.contentMaxWidthMobile !== "") {
    out.push(
      `--ns-content-max-m:${num(l.contentMaxWidthMobile, num(l.contentMaxWidth, 1200))}px`
    );
  }
  if (l.borderRadiusMobile != null && l.borderRadiusMobile !== "") {
    out.push(
      `--ns-radius-m:${num(l.borderRadiusMobile, num(l.borderRadius, 0))}px`
    );
  }
  return out;
}

// Per-slide overlay merge — each non-split slide may override any
// subset of the section's overlay fields. The merged "theme" reuses
// `resolveOverlay` / `resolveOverlayMobile` so per-slide and section
// overlays share one resolver (no behaviour drift). A `null` or
// empty per-slide field falls back to the section value.
//
// We split the merge across the desktop / mobile field groups so
// users can override e.g. just the mobile gradient on one slide
// without touching its desktop overlay.
function mergedThemeForSlide(slide, theme) {
  const merged = { ...theme };
  const pick = (k) => {
    if (slide[k] !== undefined && slide[k] !== null && slide[k] !== "") {
      merged[k] = slide[k];
    }
  };
  // Desktop overlay axes
  pick("overlayType");
  pick("overlayColor");
  pick("overlayOpacity");
  pick("overlayGradientFrom");
  pick("overlayGradientTo");
  pick("overlayGradientAngle");
  // Mobile overlay axes
  pick("overlayTypeMobile");
  pick("overlayColorMobile");
  pick("overlayOpacityMobile");
  pick("overlayGradientFromMobile");
  pick("overlayGradientToMobile");
  pick("overlayGradientAngleMobile");
  return merged;
}

/**
 * Returns the per-slide overlay CSS-variable assignments for the
 * slide's root `<div class="ns-slide ...">` style attribute.
 *
 * We only emit assignments where the slide overrides the section
 * default — slides that fully inherit ship zero overlay vars so
 * the section root's `--ns-overlay-bg` etc. cascade in unchanged.
 * This keeps the snippet output minimal AND means the editor's
 * `.ns-overlay` element keeps its single section-level definition.
 *
 * Split slides skip the overlay entirely (their `.ns-overlay` is
 * `display:none`) so we early-return for them.
 */
function slideOverlayStyle(slide, cfg, transition) {
  if (slide.layout === "split") return "";
  const sectionDesktop = resolveOverlay(cfg.theme, transition);
  const sectionMobile = resolveOverlayMobile(cfg.theme, transition);
  const merged = mergedThemeForSlide(slide, cfg.theme || {});
  const slideDesktop = resolveOverlay(merged, transition);
  const slideMobile = resolveOverlayMobile(merged, transition);
  const parts = [];
  if (
    slideDesktop.bg !== sectionDesktop.bg ||
    slideDesktop.opacity !== sectionDesktop.opacity
  ) {
    parts.push(`--ns-overlay-bg:${slideDesktop.bg}`);
    parts.push(`--ns-overlay-op:${slideDesktop.opacity}`);
  }
  // Mobile-only emission. Either slide or section may have a mobile
  // override; we emit when the resulting mobile overlay differs from
  // the section's resolved mobile (or, if section has no mobile, we
  // emit when slide introduces one).
  const sM = sectionMobile;
  const slM = slideMobile;
  const mobileChanged =
    (slM && !sM) ||
    (!slM && sM) ||
    (slM && sM && (slM.bg !== sM.bg || slM.opacity !== sM.opacity));
  if (mobileChanged && slM) {
    parts.push(`--ns-overlay-bg-m:${slM.bg}`);
    parts.push(`--ns-overlay-op-m:${slM.opacity}`);
  }
  return parts.join(";");
}

// Per-slide split-layout resolution. Each split slide may override
// `imageSide` (left/right), `panelRatio` (30..70 → panel column %)
// and `mobileImagePanelGap` (0..48 px gap between image and panel
// on mobile). Missing per-slide values fall back to the section-
// level layout. Returns the resolved triplet — used both by
// `splitSlideInner` for DOM ordering and by `splitSlideRootStyle`
// for the inline `--ns-grid-cols` / `--ns-mig` CSS variables.
function resolveSlideSplit(slide, cfg) {
  const l = cfg.layout || {};
  const sectionImageSide = l.imageSide === "left" ? "left" : "right";
  const sectionRatio = Math.max(30, Math.min(70, num(l.panelRatio, 50)));
  const sectionGap = Math.max(0, Math.min(48, num(l.mobileImagePanelGap, 0)));
  const imageSide = slide.imageSide
    ? slide.imageSide === "left"
      ? "left"
      : "right"
    : sectionImageSide;
  const ratio =
    slide.panelRatio != null && slide.panelRatio !== ""
      ? Math.max(30, Math.min(70, num(slide.panelRatio, sectionRatio)))
      : sectionRatio;
  const gap =
    slide.mobileImagePanelGap != null && slide.mobileImagePanelGap !== ""
      ? Math.max(0, Math.min(48, num(slide.mobileImagePanelGap, sectionGap)))
      : sectionGap;
  return { imageSide, ratio, gap, sectionImageSide, sectionRatio, sectionGap };
}

// Returns the inline `style="..."` payload for a split slide's root
// `<div class="ns-slide is-split">`. We only emit overrides when the
// resolved value differs from the section default — the section CSS
// uses `var(--ns-grid-cols, <section default>)` etc. so inherited
// values automatically pick up the section setting without bloating
// every slide's style attribute.
function splitSlideRootStyle(slide, cfg) {
  const s = resolveSlideSplit(slide, cfg);
  const parts = [];
  if (s.imageSide !== s.sectionImageSide || s.ratio !== s.sectionRatio) {
    const panelPct = s.ratio;
    const imagePct = 100 - s.ratio;
    const cols =
      s.imageSide === "left"
        ? `${imagePct}% ${panelPct}%`
        : `${panelPct}% ${imagePct}%`;
    parts.push(`--ns-grid-cols:${cols}`);
  }
  if (s.gap !== s.sectionGap) {
    parts.push(`--ns-mig:${s.gap}px`);
  }
  return parts.join(";");
}

function splitSlideInner(slide, cfg) {
  const split = resolveSlideSplit(slide, cfg);
  const imageSide = split.imageSide;
  const logo = safeUrl(slide.logo);
  const bg = safeUrl(slide.image);
  const bgMobile = safeUrl(slide.imageMobile);
  const cta = slide.ctaText && slide.ctaText.trim();
  const link = safeUrl(slide.ctaLink || "#");
  const target = slide.openInSameTab ? "_self" : "_blank";
  const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';

  // Panel sits on the side OPPOSITE to the image.
  const panelSide = imageSide === "left" ? "right" : "left";
  const panelBg = slidePanelBackground(slide, cfg);
  const panelBgMobile = slidePanelBackgroundMobile(slide, cfg);

  // Emit panel background as CSS custom properties so the section
  // stylesheet can swap between desktop / mobile under a media
  // query. (Inline `background:` would shadow the @media rule.)
  const panelStyle = panelBgMobile
    ? `--ns-pb:${panelBg};--ns-pb-m:${panelBgMobile}`
    : `--ns-pb:${panelBg}`;

  const panelHtml = `<div class="ns-panel is-side-${panelSide}" style="${panelStyle}">
    <div class="ns-panel-inner">
      ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'} style="height:${num(slide.logoMaxHeight, 48)}px;max-height:none;max-width:none;width:auto"/>` : ""}
      ${slideEyebrowHtml(slide, cfg.theme)}
      ${slide.title ? `<h2 class="ns-title"${slideTitleStyle(slide)}>${escHtml(slide.title)}</h2>` : ""}
      ${slide.subtitle ? `<p class="ns-subtitle"${slideSubtitleStyle(slide)}>${escHtml(slide.subtitle)}</p>` : ""}
      ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}${slideCtaStyle(slide, cfg)}>${escHtml(cta)}</a>` : ""}
    </div>
  </div>`;

  // `<picture>` lets us serve a different image on mobile via the
  // media query, with graceful fall-back to the desktop `<img>` when
  // no mobile variant was uploaded.
  const imgInner = bgMobile
    ? `<picture><source media="(max-width:767px)" srcset="${escAttr(bgMobile)}"/><img src="${escAttr(bg)}" alt="${escAttr(slide.title || "")}"/></picture>`
    : bg
      ? `<img src="${escAttr(bg)}" alt="${escAttr(slide.title || "")}"/>`
      : "";
  const imageHtml = `<div class="ns-image-wrap">${imgInner}</div>`;

  return `<div class="ns-split-grid">${imageSide === "left" ? imageHtml + panelHtml : panelHtml + imageHtml}</div>`;
}

function splitCss(cls, cfg) {
  const t = cfg.theme || {};
  const l = cfg.layout || {};
  const imageSide = l.imageSide === "left" ? "left" : "right";
  const ratio = Math.max(30, Math.min(70, num(l.panelRatio, 50)));
  const panelPct = ratio;
  const imagePct = 100 - ratio;
  const contentMax = num(l.contentMaxWidth, 1200);
  const mobileGap = Math.max(0, Math.min(48, num(l.mobileImagePanelGap, 0)));

  const gridCols =
    imageSide === "left"
      ? `${imagePct}% ${panelPct}%`
      : `${panelPct}% ${imagePct}%`;

  // Note: `.ns-panel` background is NOT set here — it's emitted as an
  // inline style on the element itself from `splitSlideInner` so each
  // slide can carry its own background (per-slide override). The
  // section-level theme.panelBg* fields act as the default fallback,
  // applied by `slidePanelBackground(slide, cfg)`.
  //
  // We *intentionally* re-scope inside .ns-slide.is-split so these
  // rules override the standard padding / overlay rules in both
  // renderSlide and renderFade without needing to touch their base CSS
  // strings, AND so non-split slides in the same carousel still get
  // the classic background-image-with-overlay treatment.
  //
  // `align-items:stretch` on the slide is critical — both renderSlide
  // and renderFade set the slide to `display:flex; align-items:center`,
  // which would otherwise vertically centre the inner grid (and at low
  // heights the grid would collapse to its intrinsic content height
  // instead of filling the slide). Stretching the grid makes the image
  // fill the slide edge-to-edge regardless of `height`.
  //
  // Vertical padding intentionally kept low (24px) so split panels
  // remain usable at heights as low as 150px. Horizontal padding stays
  // at 48px for breathing room between content and image.
  return `
.${cls} .ns-slide.is-split{padding:0;background:none;align-items:stretch;display:flex}
.${cls} .ns-slide.is-split .ns-overlay{display:none}
.${cls} .ns-slide.is-split .ns-content{display:none}
.${cls} .ns-slide.is-split .ns-split-grid{display:grid;grid-template-columns:var(--ns-grid-cols, ${gridCols});width:100%;height:100%;min-height:100%;align-items:stretch}
.${cls} .ns-slide.is-split .ns-panel{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:24px 48px;overflow:hidden;background:var(--ns-pb)}
.${cls} .ns-slide.is-split .ns-panel-inner{width:100%;max-width:${Math.floor(contentMax / 2)}px}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-logo{display:block;max-height:48px;max-width:190px;margin:0 0 12px;object-fit:contain}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-eyebrow{margin:0 0 10px}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-title{margin:0 0 8px}
.${cls} .ns-slide.is-split .ns-panel-inner .ns-subtitle{margin:0 0 14px}
.${cls} .ns-slide.is-split .ns-image-wrap{position:relative;min-width:0;background:#f7f7f8;overflow:hidden;height:100%}
.${cls} .ns-slide.is-split .ns-image-wrap img{width:100%;height:100%;object-fit:cover;display:block}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-left{padding-left:max(20px,calc((100vw - ${contentMax}px) / 2));padding-right:48px}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-right{padding-right:max(20px,calc((100vw - ${contentMax}px) / 2));padding-left:48px}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-left .ns-panel-inner{margin-left:0;margin-right:auto}
.${cls}.is-full .ns-slide.is-split .ns-panel.is-side-right .ns-panel-inner{margin-left:auto;margin-right:0}
@media (max-width:767px){.${cls} .ns-slide.is-split{height:auto;min-height:var(--ns-height-m, var(--ns-height))}.${cls}:has(.ns-slide.is-split){height:auto;min-height:var(--ns-height-m, var(--ns-height))}.${cls}:has(.ns-slide.is-split) .ns-slide{height:auto;min-height:var(--ns-height-m, var(--ns-height));align-self:stretch}.${cls}.is-fade:has(.ns-slide.is-split){display:grid;grid-template-columns:1fr}.${cls}.is-fade:has(.ns-slide.is-split) .ns-slide{position:relative;inset:auto;grid-area:1/1;align-self:stretch}.${cls} .ns-slide.is-split .ns-split-grid{grid-template-columns:1fr;grid-template-rows:auto 1fr;height:100%;align-content:start;gap:0}.${cls} .ns-slide.is-split .ns-image-wrap{order:1;grid-row:1;min-height:200px;height:200px}.${cls} .ns-slide.is-split .ns-panel{order:2;grid-row:2;padding:24px!important;background:var(--ns-pb-m, var(--ns-pb));overflow:visible;height:auto;min-height:auto}.${cls} .ns-slide.is-split .ns-panel-inner{max-width:none!important;margin:0!important}}
`.trim();
}

function renderSlide(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-slide-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const padX = padXOf(l || {}, 56);
  const slides = (cfg.slides || []).filter(Boolean);
  // Per-slide layout — back-compat: a slide without an explicit
  // `layout` field inherits the legacy top-level `cfg.slideLayout` if
  // present (last-turn behaviour), otherwise defaults to "standard".
  const slideMode = (slide) =>
    slide.layout || cfg.slideLayout || "standard";
  const anySplit = slides.some((sl) => slideMode(sl) === "split");

  // Arrow visibility: prefer the new `arrowsVisibility` knob, fall
  // back to the legacy `showArrows` boolean (false → never, true →
  // always) so existing sections render identically.
  const arrowsVisibility =
    s.arrowsVisibility ||
    (s.showArrows === false ? "never" : "always");
  const textAlign =
    l.textAlign === "right" || l.textAlign === "center" ? l.textAlign : "left";
  const textAlignMobile =
    l.textAlignMobile === "left" ||
    l.textAlignMobile === "center" ||
    l.textAlignMobile === "right"
      ? l.textAlignMobile
      : "";
  const isMobileCenter = textAlignMobile === "center";

  // Resolve the desktop & mobile overlays (helper handles the legacy
  // "default" look). The mobile variant is emitted as separate CSS
  // custom properties so we can swap it under a @media (max-width:767px)
  // rule without re-rendering the snippet.
  const overlayDesktop = resolveOverlay(t, "slide");
  const overlayMobile = resolveOverlayMobile(t, "slide");
  const mobileLayout = mobileLayoutVars(l);

  const styleVars = [
    `--ns-cta-bg:${safeColor(t.ctaBg, "#E01839")}`,
    `--ns-cta-text:${safeColor(t.ctaText, "#ffffff")}`,
    `--ns-title:${safeColor(t.titleColor, "#ffffff")}`,
    `--ns-subtitle:${safeColor(t.subtitleColor, "#ffffff")}`,
    `--ns-height:${num(l.height, 520)}px`,
    `--ns-content-max:${num(l.contentMaxWidth, 720)}px`,
    `--ns-radius:${num(l.borderRadius, 0)}px`,
    `--ns-text-align:${textAlign}`,
    `--ns-text-align-m:${textAlignMobile || textAlign}`,
    `--ns-overlay-bg:${overlayDesktop.bg}`,
    `--ns-overlay-op:${overlayDesktop.opacity}`,
    overlayMobile
      ? `--ns-overlay-bg-m:${overlayMobile.bg};--ns-overlay-op-m:${overlayMobile.opacity}`
      : "",
    ...mobileLayout,
  ]
    .filter(Boolean)
    .join(";");

  const slidesHtml = slides
    .map((slide, idx) => {
      if (slideMode(slide) === "split") {
        const splitStyle = splitSlideRootStyle(slide, cfg);
        return `<div class="ns-slide is-split"${splitStyle ? ` style="${splitStyle}"` : ""} data-ns-list="hero-slide" data-ns-item="${idx}">${splitSlideInner(slide, cfg)}</div>`;
      }
      const bg = safeUrl(slide.image);
      const bgMobile = safeUrl(slide.imageMobile);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      const target = slide.openInSameTab ? "_self" : "_blank";
      const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';
      const overlayStyle = slideOverlayStyle(slide, cfg, "slide");
      const slideStyle = [
        bgMobile
          ? `--ns-bg:url('${escAttr(bg)}');--ns-bg-m:url('${escAttr(bgMobile)}')`
          : `--ns-bg:url('${escAttr(bg)}')`,
        overlayStyle,
      ]
        .filter(Boolean)
        .join(";");
      return `<div class="ns-slide" style="${slideStyle}" data-ns-list="hero-slide" data-ns-item="${idx}">
      <div class="ns-overlay"></div>
      <div class="ns-content">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'} style="height:${num(slide.logoMaxHeight, 48)}px;max-height:none;max-width:none;width:auto"/>` : ""}
        ${slideEyebrowHtml(slide, cfg.theme)}
        ${slide.title ? `<h2 class="ns-title"${slideTitleStyle(slide)}>${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle"${slideSubtitleStyle(slide)}>${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}${slideCtaStyle(slide, cfg)}>${escHtml(cta)}</a>` : ""}
      </div>
    </div>`;
    })
    .join("");

  // Carousel chrome (arrows + dots) is meaningless with a single
  // slide — suppress both the HTML and the CSS class hooks so the
  // section doesn't reserve dot-row spacing for nothing.
  const isCarousel = slides.length > 1;

  const dotsHtml = s.showDots && isCarousel
    ? `<div class="ns-dots" role="tablist">${slides
        .map(
          (_, i) =>
            `<button class="ns-dot${i === 0 ? " is-active" : ""}" type="button" data-ns-dot="${i}" aria-label="Slide ${i + 1}"></button>`
        )
        .join("")}</div>`
    : "";

  const arrowsHtml = arrowsVisibility !== "never" && isCarousel
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  // Class hooks for CSS toggles. `is-arrows-desktop` hides arrows
  // under (max-width:767px); `is-arrows-mobile` hides them above
  // it; "always" / "never" get no class (always shown / never
  // rendered respectively).
  const arrowsCls =
    !isCarousel || arrowsVisibility === "always" || arrowsVisibility === "never"
      ? ""
      : arrowsVisibility === "desktop"
        ? " is-arrows-desktop"
        : arrowsVisibility === "mobile"
          ? " is-arrows-mobile"
          : "";
  const dotsCls = s.showDots && isCarousel ? " has-dots" : "";
  const mobileCenterCls = isMobileCenter ? " is-mobile-center" : "";

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;height:var(--ns-height);overflow:hidden;border-radius:var(--ns-radius,0);color:var(--ns-title)}
.${cls} .ns-track{display:flex;height:100%;transition:transform .6s ease;will-change:transform;touch-action:pan-y}
.${cls} .ns-slide{flex:0 0 100%;height:100%;background-image:var(--ns-bg);background-size:cover;background-position:center;background-repeat:no-repeat;display:flex;align-items:center;padding:48px ${padX}px;position:relative}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay-bg);opacity:var(--ns-overlay-op,1);pointer-events:none}
.${cls} .ns-content{position:relative;z-index:2;max-width:var(--ns-content-max);text-align:var(--ns-text-align,left)}
.${cls} .ns-content[data-align="center"], .${cls} .ns-content{}
.${cls} .ns-logo{display:block;max-height:48px;max-width:190px;margin:0 auto 22px 0;object-fit:contain}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin:0 0 12px;color:var(--ns-title)}
.${cls} .ns-title{font-size:${num(cfg.headingSize, 48)}px;font-weight:700;line-height:${num(cfg.titleLineHeight, 1.2)};letter-spacing:-.02em;color:var(--ns-title);margin:0 0 14px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);margin:0 0 26px;max-width:520px}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:13px 28px;border-radius:${num(cfg.buttonRadius, 8)}px;font-weight:600;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:50%;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.4);color:#fff;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:5;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.6)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:0;right:0;display:flex;justify-content:center;gap:10px;z-index:5}
.${cls} .ns-dot{width:10px;height:10px;border-radius:50%;border:1px solid #fff;background:transparent;padding:0;cursor:pointer;transition:background .15s ease}
.${cls} .ns-dot.is-active{background:#fff}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}.${cls} .ns-title{font-size:min(${num(cfg.headingSize, 48)}px, 7vw)}}
.${cls}.is-full .ns-slide{padding-left:max(${padX}px,calc((100vw - var(--ns-content-max)) / 2));padding-right:max(${padX}px,calc((100vw - var(--ns-content-max)) / 2))}
@media (max-width:640px){.${cls}.is-full .ns-slide{padding-left:24px;padding-right:24px}}
@media (max-width:767px){.${cls}{height:var(--ns-height-m, var(--ns-height));border-radius:var(--ns-radius-m, var(--ns-radius))}.${cls} .ns-content{max-width:var(--ns-content-max-m, var(--ns-content-max))}.${cls} .ns-slide{background-image:var(--ns-bg-m, var(--ns-bg))}.${cls} .ns-overlay{background:var(--ns-overlay-bg-m, var(--ns-overlay-bg));opacity:var(--ns-overlay-op-m, var(--ns-overlay-op, 1))}.${cls} .ns-content{text-align:var(--ns-text-align-m, var(--ns-text-align, left))}.${cls}.has-dots .ns-content{padding-bottom:48px}.${cls}.has-dots .ns-slide.is-split .ns-panel-inner{padding-bottom:32px}.${cls}.is-mobile-center .ns-content{margin-left:auto;margin-right:auto;text-align:center}.${cls}.is-mobile-center .ns-logo{margin-left:auto;margin-right:auto}.${cls}.is-mobile-center .ns-subtitle{margin-left:auto;margin-right:auto}.${cls}.is-mobile-center .ns-slide.is-split .ns-panel-inner{text-align:center;margin-left:auto!important;margin-right:auto!important}.${cls}.is-mobile-center .ns-slide.is-split .ns-panel-inner .ns-logo{margin-left:auto;margin-right:auto}.${cls}.is-mobile-center .ns-slide.is-split .ns-panel-inner .ns-subtitle{margin-left:auto;margin-right:auto}.${cls}.is-arrows-desktop .ns-arrow{display:none}}
@media (min-width:768px){.${cls}.is-arrows-mobile .ns-arrow{display:none}}
${anySplit ? splitCss(cls, cfg) : ""}
`.trim();

  const html = `<section class="ns-hero ${cls}${fullBleedClass(cfg)}${arrowsCls}${dotsCls}${mobileCenterCls}" style="${styleVars}" data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}" data-ns-poh="${s.pauseOnHover === false ? "0" : "1"}" data-ns-group="section-carousel">
  <div class="ns-track" data-ns-track>${slidesHtml}</div>
  ${arrowsHtml}
  ${dotsHtml}
</section>`;

  const js = iife(
    cls,
    `var track=root.querySelector("[data-ns-track]");var dots=root.querySelectorAll(".ns-dot");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");if(!track)return;var REAL=track.children.length;if(!REAL)return;if(REAL>1){var preC=track.children[REAL-1].cloneNode(true);var postC=track.children[0].cloneNode(true);preC.setAttribute("data-ns-clone","pre");postC.setAttribute("data-ns-clone","post");preC.setAttribute("aria-hidden","true");postC.setAttribute("aria-hidden","true");track.insertBefore(preC,track.firstChild);track.appendChild(postC);}var total=track.children.length;var current=REAL>1?1:0;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||4000;var poh=root.getAttribute("data-ns-poh")!=="0";var timer=null;var locked=false;track.style.transition="none";track.style.transform="translateX(-"+(current*100)+"%)";void track.offsetWidth;track.style.transition="";function go(i){if(REAL<=1){i=(i+total)%total;}else if(i<0||i>=total){return;}current=i;track.style.transform="translateX(-"+(current*100)+"%)";var rIdx=REAL>1?((current-1+REAL)%REAL):current;dots.forEach(function(el,idx){el.classList.toggle("is-active",idx===rIdx);});}function start(){if(locked||!ap||REAL<2)return;stop();timer=setInterval(function(){go(current+1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}function setOffset(){if(!root.classList.contains("is-full")||!root.parentElement)return;var p=root.parentElement;var pr=p.getBoundingClientRect();var pad=parseFloat(getComputedStyle(p).paddingLeft)||0;var off=pr.left+pad;root.style.setProperty("--ns-fb-offset",(off>0?off:0)+"px");}track.addEventListener("transitionend",function(e){if(e.target!==track||e.propertyName!=="transform"||REAL<=1)return;if(current===0){current=REAL;track.style.transition="none";track.style.transform="translateX(-"+(current*100)+"%)";void track.offsetWidth;track.style.transition="";}else if(current===total-1){current=1;track.style.transition="none";track.style.transform="translateX(-"+(current*100)+"%)";void track.offsetWidth;track.style.transition="";}});if(prev)prev.addEventListener("click",function(){go(current-1);start();});if(next)next.addEventListener("click",function(){go(current+1);start();});dots.forEach(function(el,idx){el.addEventListener("click",function(){go(REAL>1?idx+1:idx);start();});});if(poh){root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);}var sx=0,sy=0,st=0;root.addEventListener("touchstart",function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();stop();},{passive:true});root.addEventListener("touchend",function(e){var t=e.changedTouches[0];var dx=t.clientX-sx;var dy=t.clientY-sy;var dt=Date.now()-st;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)&&dt<800){if(dx<0)go(current+1);else go(current-1);}start();});window.addEventListener("message",function(e){var d=e&&e.data;if(!d||typeof d!=="object"||d.ns!=="hero")return;if(typeof d.index==="number"){locked=true;stop();go(REAL>1?d.index+1:d.index);}else{locked=false;start();}});setOffset();window.addEventListener("resize",setOffset);var lock=(typeof window.__nsHeroIndex==="number")?window.__nsHeroIndex:null;locked=lock!==null;if(lock!==null){go(REAL>1?lock+1:lock);}else{go(current);start();}`
  );

  return wrapSnippet({ html, css, js });
}

function renderFade(cfg) {
  const uid = cfg.uid || makeUid();
  const cls = `ns-hero-fade-${uid}`;
  const t = cfg.theme;
  const l = cfg.layout;
  const s = cfg.settings;
  const padX = padXOf(l || {}, 56);
  const slides = (cfg.slides || []).filter(Boolean);
  const slideMode = (slide) =>
    slide.layout || cfg.slideLayout || "standard";
  const anySplit = slides.some((sl) => slideMode(sl) === "split");

  const arrowsVisibility =
    s.arrowsVisibility ||
    (s.showArrows === false ? "never" : "always");
  const textAlign =
    l.textAlign === "right" || l.textAlign === "center" ? l.textAlign : "left";
  const textAlignMobile =
    l.textAlignMobile === "left" ||
    l.textAlignMobile === "center" ||
    l.textAlignMobile === "right"
      ? l.textAlignMobile
      : "";
  const isMobileCenter = textAlignMobile === "center";

  // Same overlay resolver used by renderSlide — passing "fade" so the
  // "default" overlayType keeps the legacy fade behaviour (solid
  // `overlayColor` × `overlayOpacity`).
  const overlayDesktop = resolveOverlay(t, "fade");
  const overlayMobile = resolveOverlayMobile(t, "fade");
  const mobileLayout = mobileLayoutVars(l);

  const styleVars = [
    `--ns-cta-bg:${safeColor(t.ctaBg, "#E01839")}`,
    `--ns-cta-text:${safeColor(t.ctaText, "#ffffff")}`,
    `--ns-title:${safeColor(t.titleColor, "#ffffff")}`,
    `--ns-subtitle:${safeColor(t.subtitleColor, "#ffffff")}`,
    `--ns-overlay-bg:${overlayDesktop.bg}`,
    `--ns-overlay-op:${overlayDesktop.opacity}`,
    overlayMobile
      ? `--ns-overlay-bg-m:${overlayMobile.bg};--ns-overlay-op-m:${overlayMobile.opacity}`
      : "",
    `--ns-height:${num(l.height, 520)}px`,
    `--ns-content-max:${num(l.contentMaxWidth, 720)}px`,
    `--ns-radius:${num(l.borderRadius, 0)}px`,
    `--ns-text-align:${textAlign}`,
    `--ns-text-align-m:${textAlignMobile || textAlign}`,
    ...mobileLayout,
  ]
    .filter(Boolean)
    .join(";");

  const slidesHtml = slides
    .map((slide, i) => {
      if (slideMode(slide) === "split") {
        const splitStyle = splitSlideRootStyle(slide, cfg);
        return `<div class="ns-slide is-split${i === 0 ? " is-active" : ""}" data-ns-slide="${i}" data-ns-list="hero-slide" data-ns-item="${i}"${splitStyle ? ` style="${splitStyle}"` : ""}>${splitSlideInner(slide, cfg)}</div>`;
      }
      const bg = safeUrl(slide.image);
      const bgMobile = safeUrl(slide.imageMobile);
      const logo = safeUrl(slide.logo);
      const cta = slide.ctaText && slide.ctaText.trim();
      const link = safeUrl(slide.ctaLink || "#");
      const target = slide.openInSameTab ? "_self" : "_blank";
      const rel = slide.openInSameTab ? "" : ' rel="noopener noreferrer"';
      const overlayStyle = slideOverlayStyle(slide, cfg, "fade");
      const slideStyle = [
        bgMobile
          ? `--ns-bg:url('${escAttr(bg)}');--ns-bg-m:url('${escAttr(bgMobile)}')`
          : `--ns-bg:url('${escAttr(bg)}')`,
        overlayStyle,
      ]
        .filter(Boolean)
        .join(";");
      return `<div class="ns-slide${i === 0 ? " is-active" : ""}" data-ns-slide="${i}" data-ns-list="hero-slide" data-ns-item="${i}" style="${slideStyle}">
      <div class="ns-overlay"></div>
      <div class="ns-content" data-align="${escAttr(l.textAlign)}">
        ${logo ? `<img class="ns-logo" src="${escAttr(logo)}" alt="${escAttr(slide.logoAlt || "")}"${slide.logoAlt ? "" : ' aria-hidden="true"'} style="height:${num(slide.logoMaxHeight, 48)}px;max-height:none;max-width:none;width:auto"/>` : ""}
        ${slideEyebrowHtml(slide, cfg.theme)}
        ${slide.title ? `<h2 class="ns-title"${slideTitleStyle(slide)}>${escHtml(slide.title)}</h2>` : ""}
        ${slide.subtitle ? `<p class="ns-subtitle"${slideSubtitleStyle(slide)}>${escHtml(slide.subtitle)}</p>` : ""}
        ${cta ? `<a class="ns-cta" href="${escAttr(link)}" target="${target}"${rel}${slideCtaStyle(slide, cfg)}>${escHtml(cta)}</a>` : ""}
      </div>
    </div>`;
    })
    .join("");

  // Carousel chrome (arrows + dots) is meaningless with a single
  // slide — suppress both the HTML and the CSS class hooks so the
  // section doesn't reserve dot-row spacing for nothing.
  const isCarousel = slides.length > 1;

  const dotsHtml = s.showDots && isCarousel
    ? `<div class="ns-dots" role="tablist">${slides
        .map(
          (_, i) =>
            `<button class="ns-dot${i === 0 ? " is-active" : ""}" type="button" data-ns-dot="${i}" aria-label="Slide ${i + 1}"></button>`
        )
        .join("")}</div>`
    : "";

  const arrowsHtml = arrowsVisibility !== "never" && isCarousel
    ? `<button class="ns-arrow ns-prev" type="button" data-ns-prev aria-label="Previous">‹</button>
<button class="ns-arrow ns-next" type="button" data-ns-next aria-label="Next">›</button>`
    : "";

  // Class hooks for CSS toggles. `is-arrows-desktop` hides arrows
  // under (max-width:767px); `is-arrows-mobile` hides them above
  // it; "always" / "never" get no class (always shown / never
  // rendered respectively).
  const arrowsCls =
    !isCarousel || arrowsVisibility === "always" || arrowsVisibility === "never"
      ? ""
      : arrowsVisibility === "desktop"
        ? " is-arrows-desktop"
        : arrowsVisibility === "mobile"
          ? " is-arrows-mobile"
          : "";
  const dotsCls = s.showDots && isCarousel ? " has-dots" : "";
  const mobileCenterCls = isMobileCenter ? " is-mobile-center" : "";

  const css = `
${baseReset(cls)}
.${cls}{position:relative;width:100%;height:var(--ns-height);overflow:hidden;border-radius:var(--ns-radius);color:var(--ns-title);isolation:isolate;touch-action:pan-y}
.${cls} .ns-slide{position:absolute;inset:0;background-image:var(--ns-bg);background-size:cover;background-position:center;background-repeat:no-repeat;opacity:0;transition:opacity .6s ease;pointer-events:none;display:flex;align-items:center;padding:48px ${padX}px}
.${cls} .ns-slide.is-active{opacity:1;pointer-events:auto;z-index:1}
.${cls} .ns-overlay{position:absolute;inset:0;background:var(--ns-overlay-bg);opacity:var(--ns-overlay-op,1);pointer-events:none}
.${cls} .ns-content{position:relative;z-index:2;max-width:var(--ns-content-max);width:100%;text-align:var(--ns-text-align)}
.${cls} .ns-content[data-align="center"]{margin-left:auto;margin-right:auto}
.${cls} .ns-content[data-align="right"]{margin-left:auto}
.${cls} .ns-logo{max-height:48px;max-width:190px;margin-bottom:20px;object-fit:contain}
.${cls} .ns-eyebrow{font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin:0 0 12px;color:var(--ns-title)}
.${cls} .ns-content[data-align="center"] .ns-logo{margin-left:auto;margin-right:auto}
.${cls} .ns-title{font-size:${num(cfg.headingSize, 48)}px;font-weight:700;line-height:${num(cfg.titleLineHeight, 1.2)};color:var(--ns-title);letter-spacing:-.02em;margin:0 0 12px}
.${cls} .ns-subtitle{font-size:clamp(.95rem,1.4vw,1.125rem);line-height:1.5;color:var(--ns-subtitle);max-width:560px;margin:0 0 24px}
.${cls} .ns-content[data-align="center"] .ns-subtitle{margin-left:auto;margin-right:auto}
.${cls} .ns-cta{display:inline-block;background:var(--ns-cta-bg);color:var(--ns-cta-text);padding:13px 28px;border-radius:${num(cfg.buttonRadius, 8)}px;font-weight:600;border:none;transition:transform .15s ease,filter .15s ease}
.${cls} .ns-cta:hover{transform:translateY(-1px);filter:brightness(1.08)}
.${cls} .ns-arrow{position:absolute;top:50%;transform:translateY(-50%);width:42px;height:42px;border-radius:9999px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.32);color:#fff;font-size:22px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:3;transition:background .15s ease}
.${cls} .ns-arrow:hover{background:rgba(0,0,0,.55)}
.${cls} .ns-prev{left:16px}
.${cls} .ns-next{right:16px}
.${cls} .ns-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:3}
.${cls} .ns-dot{width:8px;height:8px;padding:0;border-radius:9999px;border:none;background:rgba(255,255,255,.5);cursor:pointer;transition:background .15s ease,width .15s ease}
.${cls} .ns-dot.is-active{background:#fff;width:22px}
@media (max-width:640px){.${cls} .ns-slide{padding:28px 24px}.${cls} .ns-arrow{width:36px;height:36px}.${cls} .ns-title{font-size:min(${num(cfg.headingSize, 48)}px, 7vw)}}
.${cls}.is-full .ns-slide{padding-left:max(${padX}px,calc((100vw - var(--ns-content-max)) / 2));padding-right:max(${padX}px,calc((100vw - var(--ns-content-max)) / 2))}
@media (max-width:640px){.${cls}.is-full .ns-slide{padding-left:24px;padding-right:24px}}
@media (max-width:767px){.${cls}{height:var(--ns-height-m, var(--ns-height));border-radius:var(--ns-radius-m, var(--ns-radius))}.${cls} .ns-content{max-width:var(--ns-content-max-m, var(--ns-content-max))}.${cls} .ns-slide{background-image:var(--ns-bg-m, var(--ns-bg))}.${cls} .ns-overlay{background:var(--ns-overlay-bg-m, var(--ns-overlay-bg));opacity:var(--ns-overlay-op-m, var(--ns-overlay-op, 1))}.${cls} .ns-content{text-align:var(--ns-text-align-m, var(--ns-text-align, left))}.${cls}.has-dots .ns-content{padding-bottom:48px}.${cls}.has-dots .ns-slide.is-split .ns-panel-inner{padding-bottom:32px}.${cls}.is-mobile-center .ns-content{margin-left:auto;margin-right:auto;text-align:center}.${cls}.is-mobile-center .ns-logo{margin-left:auto;margin-right:auto}.${cls}.is-mobile-center .ns-subtitle{margin-left:auto;margin-right:auto}.${cls}.is-mobile-center .ns-slide.is-split .ns-panel-inner{text-align:center;margin-left:auto!important;margin-right:auto!important}.${cls}.is-mobile-center .ns-slide.is-split .ns-panel-inner .ns-logo{margin-left:auto;margin-right:auto}.${cls}.is-mobile-center .ns-slide.is-split .ns-panel-inner .ns-subtitle{margin-left:auto;margin-right:auto}.${cls}.is-arrows-desktop .ns-arrow{display:none}}
@media (min-width:768px){.${cls}.is-arrows-mobile .ns-arrow{display:none}}
${anySplit ? splitCss(cls, cfg) : ""}
`.trim();

  const html = `<section class="ns-hero ${cls} is-fade${fullBleedClass(cfg)}${arrowsCls}${dotsCls}${mobileCenterCls}" style="${styleVars}" data-ns-autoplay="${s.autoplay ? "1" : "0"}" data-ns-interval="${s.interval}" data-ns-poh="${s.pauseOnHover === false ? "0" : "1"}" data-ns-group="section-carousel">
${slidesHtml}
${arrowsHtml}
${dotsHtml}
</section>`;

  const js = iife(
    cls,
    `var slides=root.querySelectorAll(".ns-slide");var dots=root.querySelectorAll(".ns-dot");var prev=root.querySelector("[data-ns-prev]");var next=root.querySelector("[data-ns-next]");var current=0;var total=slides.length;if(!total)return;var ap=root.getAttribute("data-ns-autoplay")==="1";var interval=parseInt(root.getAttribute("data-ns-interval"),10)||5000;var poh=root.getAttribute("data-ns-poh")!=="0";var timer=null;var locked=false;function go(i){current=(i+total)%total;slides.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});dots.forEach(function(el,idx){el.classList.toggle("is-active",idx===current);});}function start(){if(locked||!ap||total<2)return;stop();timer=setInterval(function(){go(current+1);},interval);}function stop(){if(timer){clearInterval(timer);timer=null;}}function setOffset(){if(!root.classList.contains("is-full")||!root.parentElement)return;var p=root.parentElement;var pr=p.getBoundingClientRect();var pad=parseFloat(getComputedStyle(p).paddingLeft)||0;var off=pr.left+pad;root.style.setProperty("--ns-fb-offset",(off>0?off:0)+"px");}if(prev)prev.addEventListener("click",function(){go(current-1);start();});if(next)next.addEventListener("click",function(){go(current+1);start();});dots.forEach(function(el,idx){el.addEventListener("click",function(){go(idx);start();});});if(poh){root.addEventListener("mouseenter",stop);root.addEventListener("mouseleave",start);}var sx=0,sy=0,st=0;root.addEventListener("touchstart",function(e){var t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();stop();},{passive:true});root.addEventListener("touchend",function(e){var t=e.changedTouches[0];var dx=t.clientX-sx;var dy=t.clientY-sy;var dt=Date.now()-st;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)&&dt<800){if(dx<0)go(current+1);else go(current-1);}start();});window.addEventListener("message",function(e){var d=e&&e.data;if(!d||typeof d!=="object"||d.ns!=="hero")return;if(typeof d.index==="number"){locked=true;stop();go(d.index);}else{locked=false;start();}});setOffset();window.addEventListener("resize",setOffset);var lock=(typeof window.__nsHeroIndex==="number")?window.__nsHeroIndex:null;locked=lock!==null;if(lock!==null){go(lock);}else{go(0);start();}`
  );

  return wrapSnippet({ html, css, js });
}

function render(cfg) {
  const inner = cfg.transition === "fade" ? renderFade(cfg) : renderSlide(cfg);
  const padTop = padTopOf(cfg.layout || {}, 0);
  const padBot = padBotOf(cfg.layout || {}, 0);
  if (!padTop && !padBot) return inner;
  return `<div style="padding-top:${padTop}px;padding-bottom:${padBot}px">${inner}</div>`;
}

// Overlay form controls. Two sibling components — Desktop and Mobile —
// render the same fields but bind to different theme keys. Whichever
// one renders is decided by the parent FormPanel based on the user's
// current preview viewport (`previewMode` prop). The split avoids one
// big conditional and keeps the testid namespace distinct.
function OverlayControlsDesktop({ theme, setTheme }) {
  const type = theme.overlayType || "default";
  return (
    <>
      <SelectField
        label="Overlay style"
        value={type}
        onChange={(v) => setTheme({ overlayType: v })}
        options={[
          { value: "default", label: "Default (keep current look)" },
          { value: "solid", label: "Solid colour" },
          { value: "gradient", label: "Linear gradient" },
        ]}
        testid="hero-overlay-type"
      />
      {type === "solid" && (
        <ColorField
          label="Overlay colour"
          value={theme.overlayColor || "#000000"}
          onChange={(v) => setTheme({ overlayColor: v })}
          testid="hero-overlay-color"
        />
      )}
      {type === "gradient" && (
        <>
          <ColorField
            label="From colour"
            value={theme.overlayGradientFrom || "#000000"}
            onChange={(v) => setTheme({ overlayGradientFrom: v })}
            testid="hero-overlay-from"
          />
          <ColorField
            label="To colour"
            value={theme.overlayGradientTo || "rgba(0,0,0,0)"}
            onChange={(v) => setTheme({ overlayGradientTo: v })}
            testid="hero-overlay-to"
          />
          <SliderField
            label="Angle"
            value={Number(theme.overlayGradientAngle) || 90}
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => setTheme({ overlayGradientAngle: v })}
            testid="hero-overlay-angle"
          />
        </>
      )}
      {type !== "default" && (
        <SliderField
          label="Opacity"
          value={Math.round((Number(theme.overlayOpacity) || 0.5) * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => setTheme({ overlayOpacity: v / 100 })}
          testid="hero-overlay-opacity"
        />
      )}
    </>
  );
}

function OverlayControlsMobile({ theme, setTheme }) {
  // "" means "inherit desktop". Treat as the on-screen default until
  // the user opts into a mobile override.
  const typeM = theme.overlayTypeMobile || "";
  const opacityM =
    theme.overlayOpacityMobile == null || theme.overlayOpacityMobile === ""
      ? Number(theme.overlayOpacity) || 0.5
      : Number(theme.overlayOpacityMobile);
  return (
    <>
      <SelectField
        label="Mobile overlay style"
        value={typeM || "inherit"}
        onChange={(v) => setTheme({ overlayTypeMobile: v === "inherit" ? "" : v })}
        options={[
          { value: "inherit", label: "Inherit from desktop" },
          { value: "default", label: "Default (keep desktop visuals)" },
          { value: "solid", label: "Solid colour" },
          { value: "gradient", label: "Linear gradient" },
        ]}
        testid="hero-overlay-type-mobile"
      />
      {typeM === "solid" && (
        <ColorField
          label="Mobile overlay colour"
          value={theme.overlayColorMobile || theme.overlayColor || "#000000"}
          onChange={(v) => setTheme({ overlayColorMobile: v })}
          testid="hero-overlay-color-mobile"
        />
      )}
      {typeM === "gradient" && (
        <>
          <ColorField
            label="Mobile from colour"
            value={
              theme.overlayGradientFromMobile ||
              theme.overlayGradientFrom ||
              "#000000"
            }
            onChange={(v) => setTheme({ overlayGradientFromMobile: v })}
            testid="hero-overlay-from-mobile"
          />
          <ColorField
            label="Mobile to colour"
            value={
              theme.overlayGradientToMobile ||
              theme.overlayGradientTo ||
              "rgba(0,0,0,0)"
            }
            onChange={(v) => setTheme({ overlayGradientToMobile: v })}
            testid="hero-overlay-to-mobile"
          />
          <SliderField
            label="Mobile angle"
            value={
              Number(
                theme.overlayGradientAngleMobile == null
                  ? theme.overlayGradientAngle
                  : theme.overlayGradientAngleMobile
              ) || 90
            }
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => setTheme({ overlayGradientAngleMobile: v })}
            testid="hero-overlay-angle-mobile"
          />
        </>
      )}
      {typeM && (
        <SliderField
          label="Mobile opacity"
          value={Math.round(opacityM * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => setTheme({ overlayOpacityMobile: v / 100 })}
          testid="hero-overlay-opacity-mobile"
        />
      )}
    </>
  );
}

/**
 * Slide-scoped overlay controls. Mirror the section variants but
 * write to slide-level fields (`slide.overlay*`). Missing fields
 * fall back to the section default via the rendering pipeline's
 * `mergedThemeForSlide` — so the visible defaults shown in the
 * fields are the section's effective values, and the user can
 * override any single axis without disturbing the rest.
 *
 * `inheritOption` adds a "Use section default" choice to the type
 * dropdown so a slide that diverged can be reset to inherit again
 * by clearing the field (`overlayType: ""`).
 */
function SlideOverlayControlsDesktop({ slide, sectionTheme, setSlide }) {
  // "" = inherit section's overlayType for this slide
  const slideType = slide.overlayType || "";
  // Visible "from" for fields uses slide value OR section default
  // so the user sees what's actually rendering.
  const eff = (k, fallback) =>
    slide[k] !== undefined && slide[k] !== null && slide[k] !== ""
      ? slide[k]
      : sectionTheme[k] !== undefined
        ? sectionTheme[k]
        : fallback;
  const opacityPct = Math.round(
    (Number(slide.overlayOpacity) ||
      Number(sectionTheme.overlayOpacity) ||
      0.5) * 100
  );
  return (
    <>
      <SelectField
        label="Overlay style (this slide)"
        value={slideType || "__inherit"}
        onChange={(v) =>
          setSlide({ overlayType: v === "__inherit" ? "" : v })
        }
        options={[
          { value: "__inherit", label: "Use section default" },
          { value: "default", label: "Default (keep current look)" },
          { value: "solid", label: "Solid colour" },
          { value: "gradient", label: "Linear gradient" },
        ]}
        testid={`hero-slide-overlay-type-${slide.id}`}
      />
      {slideType === "solid" && (
        <ColorField
          label="Overlay colour"
          value={eff("overlayColor", "#000000")}
          onChange={(v) => setSlide({ overlayColor: v })}
          testid={`hero-slide-overlay-color-${slide.id}`}
        />
      )}
      {slideType === "gradient" && (
        <>
          <ColorField
            label="From colour"
            value={eff("overlayGradientFrom", "#000000")}
            onChange={(v) => setSlide({ overlayGradientFrom: v })}
            testid={`hero-slide-overlay-from-${slide.id}`}
          />
          <ColorField
            label="To colour"
            value={eff("overlayGradientTo", "rgba(0,0,0,0)")}
            onChange={(v) => setSlide({ overlayGradientTo: v })}
            testid={`hero-slide-overlay-to-${slide.id}`}
          />
          <SliderField
            label="Angle"
            value={Number(eff("overlayGradientAngle", 90))}
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => setSlide({ overlayGradientAngle: v })}
            testid={`hero-slide-overlay-angle-${slide.id}`}
          />
        </>
      )}
      {slideType && slideType !== "default" && (
        <SliderField
          label="Opacity"
          value={opacityPct}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => setSlide({ overlayOpacity: v / 100 })}
          testid={`hero-slide-overlay-opacity-${slide.id}`}
        />
      )}
    </>
  );
}

function SlideOverlayControlsMobile({ slide, sectionTheme, setSlide }) {
  const slideTypeM = slide.overlayTypeMobile || "";
  const eff = (k, fallback) =>
    slide[k] !== undefined && slide[k] !== null && slide[k] !== ""
      ? slide[k]
      : sectionTheme[k] !== undefined
        ? sectionTheme[k]
        : fallback;
  const opacityM =
    slide.overlayOpacityMobile != null && slide.overlayOpacityMobile !== ""
      ? Number(slide.overlayOpacityMobile)
      : Number(slide.overlayOpacity) ||
        Number(sectionTheme.overlayOpacityMobile) ||
        Number(sectionTheme.overlayOpacity) ||
        0.5;
  return (
    <>
      <SelectField
        label="Mobile overlay style (this slide)"
        value={slideTypeM || "__inherit"}
        onChange={(v) =>
          setSlide({ overlayTypeMobile: v === "__inherit" ? "" : v })
        }
        options={[
          { value: "__inherit", label: "Use section default" },
          { value: "default", label: "Default (keep desktop visuals)" },
          { value: "solid", label: "Solid colour" },
          { value: "gradient", label: "Linear gradient" },
        ]}
        testid={`hero-slide-overlay-type-m-${slide.id}`}
      />
      {slideTypeM === "solid" && (
        <ColorField
          label="Mobile overlay colour"
          value={eff("overlayColorMobile", eff("overlayColor", "#000000"))}
          onChange={(v) => setSlide({ overlayColorMobile: v })}
          testid={`hero-slide-overlay-color-m-${slide.id}`}
        />
      )}
      {slideTypeM === "gradient" && (
        <>
          <ColorField
            label="Mobile from colour"
            value={eff(
              "overlayGradientFromMobile",
              eff("overlayGradientFrom", "#000000")
            )}
            onChange={(v) => setSlide({ overlayGradientFromMobile: v })}
            testid={`hero-slide-overlay-from-m-${slide.id}`}
          />
          <ColorField
            label="Mobile to colour"
            value={eff(
              "overlayGradientToMobile",
              eff("overlayGradientTo", "rgba(0,0,0,0)")
            )}
            onChange={(v) => setSlide({ overlayGradientToMobile: v })}
            testid={`hero-slide-overlay-to-m-${slide.id}`}
          />
          <SliderField
            label="Mobile angle"
            value={Number(
              eff(
                "overlayGradientAngleMobile",
                eff("overlayGradientAngle", 90)
              )
            )}
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => setSlide({ overlayGradientAngleMobile: v })}
            testid={`hero-slide-overlay-angle-m-${slide.id}`}
          />
        </>
      )}
      {slideTypeM && (
        <SliderField
          label="Mobile opacity"
          value={Math.round(opacityM * 100)}
          min={0}
          max={100}
          suffix="%"
          onChange={(v) => setSlide({ overlayOpacityMobile: v / 100 })}
          testid={`hero-slide-overlay-opacity-m-${slide.id}`}
        />
      )}
    </>
  );
}

/**
 * Layout form controls — viewport-specific siblings, parallel to
 * the OverlayControls pair. Desktop renders the existing knobs;
 * Mobile shows an "Override desktop layout" toggle (defaults OFF
 * = inherit everything). When the toggle flips on, per-axis
 * sliders + an alignment dropdown appear; each axis still falls
 * back to the desktop value if its mobile field is left blank.
 */
function LayoutControlsDesktop({ layout, setLayout }) {
  return (
    <>
      <SelectField
        label="Text alignment"
        value={layout.textAlign}
        onChange={(v) => setLayout({ textAlign: v })}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ]}
        testid="hero-text-align"
      />
      <SliderField
        label="Height"
        value={layout.height}
        min={150}
        max={800}
        step={10}
        suffix="px"
        onChange={(v) => setLayout({ height: v })}
        testid="hero-height"
      />
      <SliderField
        label="Content max width"
        value={layout.contentMaxWidth}
        min={320}
        max={1440}
        step={10}
        suffix="px"
        onChange={(v) => setLayout({ contentMaxWidth: v })}
        testid="hero-content-max"
      />
      {!layout.fullBleed && (
        <SliderField
          label="Border radius"
          value={layout.borderRadius}
          min={0}
          max={32}
          suffix="px"
          onChange={(v) => setLayout({ borderRadius: v })}
          testid="hero-radius"
        />
      )}
      <PaddingFields
        config={layout}
        onUpdate={setLayout}
        defaultValue={0}
        max={160}
        testidPrefix="hero"
        sideDefault={56}
      />
    </>
  );
}

function LayoutControlsMobile({ layout, setLayout }) {
  const overriding = !!layout.mobileLayoutOverride;
  return (
    <>
      <ToggleField
        label="Override desktop layout"
        description="Off = mobile inherits every desktop value. Switch on to dial in mobile-specific overrides."
        checked={overriding}
        onChange={(v) => setLayout({ mobileLayoutOverride: v })}
        testid="hero-mobile-layout-override"
      />
      {overriding && (
        <>
          <SelectField
            label="Mobile alignment"
            value={layout.textAlignMobile || ""}
            onChange={(v) => setLayout({ textAlignMobile: v })}
            options={[
              { value: "", label: "Inherit from desktop" },
              { value: "left", label: "Left" },
              { value: "center", label: "Center (all elements centred)" },
              { value: "right", label: "Right" },
            ]}
            testid="hero-text-align-mobile"
          />
          <SliderField
            label="Mobile height"
            value={
              layout.heightMobile == null || layout.heightMobile === ""
                ? layout.height
                : Number(layout.heightMobile)
            }
            min={150}
            max={800}
            step={10}
            suffix="px"
            onChange={(v) => setLayout({ heightMobile: v })}
            testid="hero-height-mobile"
          />
          <SliderField
            label="Mobile content max width"
            value={
              layout.contentMaxWidthMobile == null ||
              layout.contentMaxWidthMobile === ""
                ? layout.contentMaxWidth
                : Number(layout.contentMaxWidthMobile)
            }
            min={280}
            max={1024}
            step={10}
            suffix="px"
            onChange={(v) => setLayout({ contentMaxWidthMobile: v })}
            testid="hero-content-max-mobile"
          />
          {!layout.fullBleed && (
            <SliderField
              label="Mobile border radius"
              value={
                layout.borderRadiusMobile == null ||
                layout.borderRadiusMobile === ""
                  ? layout.borderRadius
                  : Number(layout.borderRadiusMobile)
              }
              min={0}
              max={32}
              suffix="px"
              onChange={(v) => setLayout({ borderRadiusMobile: v })}
              testid="hero-radius-mobile"
            />
          )}
        </>
      )}
    </>
  );
}

function FormPanel({ config, onUpdate, previewMode }) {
  const t = config.theme;
  const l = config.layout;
  const s = config.settings;
  const setTheme = (p) => onUpdate({ theme: { ...t, ...p } });
  const setLayout = (p) => onUpdate({ layout: { ...l, ...p } });
  const setSettings = (p) => onUpdate({ settings: { ...s, ...p } });

  // Track which slide row is currently expanded in the ListEditor so
  // the live preview can lock onto that slide (and pause autoplay)
  // while the user is editing it. A `null` openSlideId means no row
  // is being edited — the preview resumes its normal autoplay cycle.
  const [openSlideId, setOpenSlideId] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const idx = openSlideId
      ? config.slides.findIndex((x) => x.id === openSlideId)
      : -1;
    // Broadcast to PreviewFrame which forwards to the iframe via
    // postMessage. -1 / no match means "resume autoplay".
    window.dispatchEvent(
      new CustomEvent("ns-editor-slide-control", {
        detail: { index: idx >= 0 ? idx : null },
      })
    );
  }, [openSlideId, config.slides]);

  const addSlide = () => {
    onUpdate({
      slides: [
        ...config.slides,
        {
          id: makeUid(),
          title: "New Slide",
          subtitle: "Subtitle",
          image: "",
          logo: "",
          logoAlt: "",
          ctaText: "Shop now",
          ctaLink: "#",
        },
      ],
    });
  };
  const removeSlide = (id) =>
    onUpdate({ slides: config.slides.filter((x) => x.id !== id) });
  const moveSlide = (id, dir) => {
    const idx = config.slides.findIndex((x) => x.id === id);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= config.slides.length) return;
    const arr = [...config.slides];
    const [m] = arr.splice(idx, 1);
    arr.splice(ni, 0, m);
    onUpdate({ slides: arr });
  };
  const updateSlide = (id, patch) =>
    onUpdate({
      slides: config.slides.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    });
  // Duplicate inserts a clone with a fresh id directly AFTER the
  // source slide so users see the copy adjacent (not pushed to the
  // end of the carousel). ListEditor's "newly added id" detection
  // auto-expands the clone and scrolls it into view.
  const duplicateSlide = (id) => {
    const idx = config.slides.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const clone = { ...config.slides[idx], id: makeUid() };
    const arr = [...config.slides];
    arr.splice(idx + 1, 0, clone);
    onUpdate({ slides: arr });
  };

  const isFade = config.transition === "fade";
  // Per-slide layout selection lives inside each slide's form so a
  // single carousel can mix standard + split slides.
  const slideMode = (s) => s.layout || config.slideLayout || "standard";

  return (
    <FormAccordion sectionType="hero">
      <Group title="Section / Carousel" value="section-carousel">
        <SelectField
          label="Transition"
          value={config.transition}
          onChange={(v) => onUpdate({ transition: v })}
          options={[
            { value: "slide", label: "Slide" },
            { value: "fade", label: "Fade" },
          ]}
          testid="hero-transition"
        />
        <SliderField
          label="Slide title size"
          value={Number(config.headingSize) || 48}
          min={24}
          max={96}
          suffix="px"
          onChange={(v) => onUpdate({ headingSize: v })}
          testid="hero-heading-size"
        />
        <ToggleField
          label="Make wide"
          description="Stretch background to full viewport width"
          checked={config.fullBleed}
          onChange={(v) => onUpdate({ fullBleed: v })}
          testid="hero-full-bleed"
        />
        {config.slides.length > 1 && (
          <div className="pt-2 border-t border-slate-200 mt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Carousel behaviour
            </p>
            <p
              className="text-[11px] text-slate-500 mb-2 leading-snug"
              data-testid="hero-carousel-help"
            >
              Applies to the slideshow as a whole — not to individual slides.
            </p>
            <ToggleField
              label="Autoplay"
              checked={s.autoplay}
              onChange={(v) => setSettings({ autoplay: v })}
              testid="hero-autoplay"
            />
            <SliderField
              label="Interval"
              value={s.interval}
              min={2000}
              max={12000}
              step={500}
              suffix="ms"
              onChange={(v) => setSettings({ interval: v })}
              testid="hero-interval"
              disabled={!s.autoplay}
            />
            <ToggleField
              label="Pause on hover"
              checked={s.pauseOnHover !== false}
              onChange={(v) => setSettings({ pauseOnHover: v })}
              testid="hero-pause-on-hover"
            />
            <SelectField
              label="Arrows"
              value={
                s.arrowsVisibility ||
                (s.showArrows === false ? "never" : "always")
              }
              onChange={(v) =>
                setSettings({ arrowsVisibility: v, showArrows: v !== "never" })
              }
              options={[
                { value: "always", label: "Always show" },
                { value: "desktop", label: "Desktop only" },
                { value: "mobile", label: "Mobile only" },
                { value: "never", label: "Never show" },
              ]}
              testid="hero-arrows-visibility"
            />
            <ToggleField
              label="Dots"
              checked={s.showDots}
              onChange={(v) => setSettings({ showDots: v })}
              testid="hero-dots"
            />
          </div>
        )}
      </Group>

      <Group title={`Slides (${config.slides.length})`} value="slides">
        <ListEditor
          items={config.slides}
          onAdd={addSlide}
          onRemove={removeSlide}
          onMove={moveSlide}
          onDuplicate={duplicateSlide}
          addLabel="Add slide"
          testidPrefix="hero-slide"
          defaultOpenFirst={false}
          onOpenChange={setOpenSlideId}
          renderRow={(slide, i) => (
            <div className="flex items-center gap-2">
              <div className="w-10 h-7 rounded-sm bg-slate-100 flex-shrink-0 overflow-hidden">
                {slide.image && (
                  <img
                    src={slide.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">
                {slide.title || `Slide ${i + 1}`}
              </p>
            </div>
          )}
          renderForm={(slide) => (
            <>
              <SelectField
                label="Layout"
                value={slide.layout || "standard"}
                onChange={(v) => updateSlide(slide.id, { layout: v })}
                options={[
                  {
                    value: "standard",
                    label: "Standard (background image + overlay)",
                  },
                  {
                    value: "split",
                    label: "Split panel (image + coloured panel)",
                  },
                ]}
                testid={`hero-slide-layout-${slide.id}`}
              />
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {slide.layout === "split" ? "Image" : "Background"}
                </Label>
                {previewMode === "mobile" && (
                  <p className="text-[11px] text-slate-500 mb-1.5 leading-snug">
                    Shown on mobile when no mobile-specific image is set
                    below — acts as the fallback so this slide always has
                    an image.
                  </p>
                )}
                <ImageUpload
                  value={slide.image}
                  onChange={(v) => updateSlide(slide.id, { image: v })}
                  testid={`hero-slide-image-${slide.id}`}
                />
              </div>
              {previewMode === "mobile" && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Mobile image (optional)
                  </Label>
                  <p className="text-[11px] text-slate-500 mb-1.5 leading-snug">
                    Shown under 768px. Leave blank to reuse the image above.
                  </p>
                  <ImageUpload
                    value={slide.imageMobile}
                    onChange={(v) => updateSlide(slide.id, { imageMobile: v })}
                    testid={`hero-slide-image-mobile-${slide.id}`}
                    compact
                  />
                </div>
              )}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Logo (optional)
                </Label>
                <ImageUpload
                  value={slide.logo}
                  onChange={(v) => updateSlide(slide.id, { logo: v })}
                  testid={`hero-slide-logo-${slide.id}`}
                  compact
                />
              </div>
              {slide.logo ? (
                <>
                  <TextField
                    label="Logo alt text (optional)"
                    value={slide.logoAlt || ""}
                    onChange={(v) => updateSlide(slide.id, { logoAlt: v })}
                    placeholder="Leave blank if purely decorative"
                    testid={`hero-slide-logo-alt-${slide.id}`}
                  />
                  <SliderField
                    label="Logo size"
                    value={Number(slide.logoMaxHeight) || 48}
                    min={20}
                    max={150}
                    suffix="px max-height"
                    onChange={(v) => updateSlide(slide.id, { logoMaxHeight: v })}
                    testid={`hero-slide-logo-size-${slide.id}`}
                  />
                </>
              ) : null}
              <TextField
                label="Eyebrow (optional)"
                value={slide.eyebrow || ""}
                onChange={(v) => updateSlide(slide.id, { eyebrow: v })}
                placeholder="Small label above the title"
                testid={`hero-slide-eyebrow-${slide.id}`}
              />
              <TextField
                label="Title"
                value={slide.title}
                onChange={(v) => updateSlide(slide.id, { title: v })}
                testid={`hero-slide-title-${slide.id}`}
              />
              <TextAreaField
                label="Subtitle"
                value={slide.subtitle}
                onChange={(v) => updateSlide(slide.id, { subtitle: v })}
                testid={`hero-slide-subtitle-${slide.id}`}
              />

              <div className="pt-2 border-t border-slate-200 mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Text colour override (this slide only)
                </p>
                <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                  Pre-filled with the section default. Pick a new colour
                  to override just this slide — useful when a carousel
                  mixes light and dark backgrounds.
                </p>
                {slide.eyebrow ? (
                  <ColorField
                    label="Eyebrow colour"
                    value={slide.eyebrowColor || t.titleColor || "#ffffff"}
                    onChange={(v) => updateSlide(slide.id, { eyebrowColor: v })}
                    testid={`hero-slide-eyebrow-color-${slide.id}`}
                  />
                ) : null}
                <ColorField
                  label="Title colour"
                  value={slide.titleColor || t.titleColor || "#ffffff"}
                  onChange={(v) => updateSlide(slide.id, { titleColor: v })}
                  testid={`hero-slide-title-color-${slide.id}`}
                />
                <ColorField
                  label="Subtitle colour"
                  value={slide.subtitleColor || t.subtitleColor || "#ffffff"}
                  onChange={(v) => updateSlide(slide.id, { subtitleColor: v })}
                  testid={`hero-slide-subtitle-color-${slide.id}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TextField
                  label="CTA text"
                  value={slide.ctaText}
                  onChange={(v) => updateSlide(slide.id, { ctaText: v })}
                  testid={`hero-slide-cta-text-${slide.id}`}
                />
                <TextField
                  label="CTA link"
                  value={slide.ctaLink}
                  onChange={(v) => updateSlide(slide.id, { ctaLink: v })}
                  testid={`hero-slide-cta-link-${slide.id}`}
                />
              </div>
              <ToggleField
                label="Open in same tab"
                checked={slide.openInSameTab}
                onChange={(v) => updateSlide(slide.id, { openInSameTab: v })}
                testid={`hero-slide-same-tab-${slide.id}`}
              />

              {slide.ctaText ? (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Button colour override (this slide only)
                  </p>
                  <ToggleField
                    label="Override button colours"
                    checked={!!slide.ctaOverrideColors}
                    onChange={(v) => {
                      const patch = { ctaOverrideColors: v };
                      // Seed override fields with the section theme on first
                      // enable so the ColorFields show a starting hex.
                      if (v && !slide.ctaBgColor) {
                        patch.ctaBgColor = t.ctaBg || "#1f2937";
                      }
                      if (v && !slide.ctaTextColor) {
                        patch.ctaTextColor = t.ctaText || "#ffffff";
                      }
                      updateSlide(slide.id, patch);
                    }}
                    testid={`hero-slide-cta-override-${slide.id}`}
                  />
                  {slide.ctaOverrideColors && (
                    <>
                      <ColorField
                        label="Button background"
                        value={slide.ctaBgColor || t.ctaBg || "#1f2937"}
                        onChange={(v) => updateSlide(slide.id, { ctaBgColor: v })}
                        testid={`hero-slide-cta-bg-${slide.id}`}
                      />
                      <ColorField
                        label="Button text"
                        value={slide.ctaTextColor || t.ctaText || "#ffffff"}
                        onChange={(v) => updateSlide(slide.id, { ctaTextColor: v })}
                        testid={`hero-slide-cta-text-color-${slide.id}`}
                      />
                    </>
                  )}
                </div>
              ) : null}

              {slideMode(slide) === "split" && previewMode !== "mobile" && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Split panel layout (this slide)
                  </p>
                  <SelectField
                    label="Image side"
                    value={slide.imageSide || l.imageSide || "right"}
                    onChange={(v) => updateSlide(slide.id, { imageSide: v })}
                    options={[
                      { value: "right", label: "Image right of text" },
                      { value: "left", label: "Image left of text" },
                    ]}
                    testid={`hero-slide-image-side-${slide.id}`}
                  />
                  <SelectField
                    label="Panel width"
                    value={String(
                      slide.panelRatio != null && slide.panelRatio !== ""
                        ? slide.panelRatio
                        : l.panelRatio || 50
                    )}
                    onChange={(v) =>
                      updateSlide(slide.id, { panelRatio: Number(v) })
                    }
                    options={[
                      { value: "40", label: "40% — image dominant" },
                      { value: "50", label: "50% — balanced" },
                      { value: "60", label: "60% — text dominant" },
                    ]}
                    testid={`hero-slide-panel-ratio-${slide.id}`}
                  />
                </div>
              )}

              {slideMode(slide) === "split" && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Panel design override (this slide only)
                  </p>
                  <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                    Leave at "Inherit" to use the section's "Split panel
                    design" defaults. Pick a type here to override just
                    this slide's panel.
                  </p>                  <SelectField
                    label="Background type"
                    value={slide.panelBgType || ""}
                    onChange={(v) => {
                      const patch = { panelBgType: v };
                      // Seed override fields with the section's current
                      // theme values the first time the user enables this
                      // override — so the ColorField shows a starting hex
                      // instead of a blank swatch. Existing values are
                      // preserved.
                      if (v === "solid" && !slide.panelBg) {
                        patch.panelBg = t.panelBg || "#1f2937";
                      }
                      if (v === "gradient") {
                        if (!slide.panelGradientFrom)
                          patch.panelGradientFrom = t.panelGradientFrom || "#E01839";
                        if (!slide.panelGradientTo)
                          patch.panelGradientTo = t.panelGradientTo || "#1f2937";
                        if (!slide.panelGradientAngle)
                          patch.panelGradientAngle = t.panelGradientAngle || 135;
                      }
                      updateSlide(slide.id, patch);
                    }}
                    options={[
                      { value: "", label: "Inherit from section" },
                      { value: "solid", label: "Solid color" },
                      { value: "gradient", label: "Gradient" },
                    ]}
                    testid={`hero-slide-panel-bg-type-${slide.id}`}
                  />
                  {slide.panelBgType === "solid" && (
                    <ColorField
                      label="Panel color"
                      value={slide.panelBg || t.panelBg || "#1f2937"}
                      onChange={(v) => updateSlide(slide.id, { panelBg: v })}
                      testid={`hero-slide-panel-bg-${slide.id}`}
                    />
                  )}
                  {slide.panelBgType === "gradient" && (
                    <>
                      <ColorField
                        label="Gradient from"
                        value={slide.panelGradientFrom || t.panelGradientFrom || "#E01839"}
                        onChange={(v) =>
                          updateSlide(slide.id, { panelGradientFrom: v })
                        }
                        testid={`hero-slide-panel-grad-from-${slide.id}`}
                      />
                      <ColorField
                        label="Gradient to"
                        value={slide.panelGradientTo || t.panelGradientTo || "#1f2937"}
                        onChange={(v) =>
                          updateSlide(slide.id, { panelGradientTo: v })
                        }
                        testid={`hero-slide-panel-grad-to-${slide.id}`}
                      />
                      <SliderField
                        label="Gradient angle"
                        value={
                          Number(slide.panelGradientAngle) ||
                          Number(t.panelGradientAngle) ||
                          135
                        }
                        min={0}
                        max={360}
                        step={5}
                        suffix="°"
                        onChange={(v) =>
                          updateSlide(slide.id, { panelGradientAngle: v })
                        }
                        testid={`hero-slide-panel-grad-angle-${slide.id}`}
                      />
                    </>
                  )}
                  {/* Mobile override for this slide's panel BG.
                    * "Inherit" means: under (max-width:767px) fall
                    * back to the section's mobile panel BG, and if
                    * none, the slide's desktop panel BG. Setting a
                    * type here gives this slide a distinct mobile
                    * look. Surfaced only in mobile preview mode. */}
                  {previewMode === "mobile" && (
                    <div className="pt-2 border-t border-slate-200 mt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Mobile panel BG (≤767px)
                    </p>
                    <SelectField
                      label="Mobile panel background"
                      value={slide.panelBgTypeMobile || ""}
                      onChange={(v) => {
                        const patch = { panelBgTypeMobile: v };
                        // Seed colour fields from the slide's desktop
                        // values so the user sees a sensible starting
                        // point instead of empty inputs.
                        if (v === "solid" && !slide.panelBgMobile) {
                          patch.panelBgMobile =
                            slide.panelBg || t.panelBg || "#1f2937";
                        }
                        if (v === "gradient") {
                          if (!slide.panelGradientFromMobile)
                            patch.panelGradientFromMobile =
                              slide.panelGradientFrom ||
                              t.panelGradientFrom ||
                              "#E01839";
                          if (!slide.panelGradientToMobile)
                            patch.panelGradientToMobile =
                              slide.panelGradientTo ||
                              t.panelGradientTo ||
                              "#1f2937";
                          if (slide.panelGradientAngleMobile == null)
                            patch.panelGradientAngleMobile =
                              slide.panelGradientAngle ??
                              t.panelGradientAngle ??
                              135;
                        }
                        updateSlide(slide.id, patch);
                      }}
                      options={[
                        { value: "", label: "Inherit (section / desktop)" },
                        { value: "solid", label: "Solid colour" },
                        { value: "gradient", label: "Linear gradient" },
                      ]}
                      testid={`hero-slide-panel-bg-type-m-${slide.id}`}
                    />
                    {slide.panelBgTypeMobile === "solid" && (
                      <ColorField
                        label="Mobile panel colour"
                        value={
                          slide.panelBgMobile ||
                          slide.panelBg ||
                          t.panelBg ||
                          "#1f2937"
                        }
                        onChange={(v) =>
                          updateSlide(slide.id, { panelBgMobile: v })
                        }
                        testid={`hero-slide-panel-bg-m-${slide.id}`}
                      />
                    )}
                    {slide.panelBgTypeMobile === "gradient" && (
                      <>
                        <ColorField
                          label="Mobile gradient from"
                          value={
                            slide.panelGradientFromMobile ||
                            slide.panelGradientFrom ||
                            t.panelGradientFrom ||
                            "#E01839"
                          }
                          onChange={(v) =>
                            updateSlide(slide.id, {
                              panelGradientFromMobile: v,
                            })
                          }
                          testid={`hero-slide-panel-grad-from-m-${slide.id}`}
                        />
                        <ColorField
                          label="Mobile gradient to"
                          value={
                            slide.panelGradientToMobile ||
                            slide.panelGradientTo ||
                            t.panelGradientTo ||
                            "#1f2937"
                          }
                          onChange={(v) =>
                            updateSlide(slide.id, {
                              panelGradientToMobile: v,
                            })
                          }
                          testid={`hero-slide-panel-grad-to-m-${slide.id}`}
                        />
                        <SliderField
                          label="Mobile gradient angle"
                          value={
                            slide.panelGradientAngleMobile ??
                            slide.panelGradientAngle ??
                            t.panelGradientAngle ??
                            135
                          }
                          min={0}
                          max={360}
                          step={5}
                          suffix="°"
                          onChange={(v) =>
                            updateSlide(slide.id, {
                              panelGradientAngleMobile: v,
                            })
                          }
                          testid={`hero-slide-panel-grad-angle-m-${slide.id}`}
                        />
                      </>
                    )}
                    </div>
                  )}
                </div>
              )}

              {/* Per-slide overlay. Each non-split slide can override
                * its overlay; fields left blank fall back to the
                * section default via `mergedThemeForSlide` in the
                * renderer. Viewport-aware: mobile preview surfaces
                * the mobile override sub-form. */}
              {slideMode(slide) !== "split" && (
                <div className="pt-2 border-t border-slate-200 mt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Overlay (this slide)
                  </p>
                  <p className="text-[11px] text-slate-500 mb-2 leading-snug">
                    Leave style at <strong>Use section default</strong> to
                    inherit the section's overlay. Override here to give
                    this slide a different tint or gradient.
                  </p>
                  {previewMode === "mobile" ? (
                    <SlideOverlayControlsMobile
                      slide={slide}
                      sectionTheme={t}
                      setSlide={(patch) => updateSlide(slide.id, patch)}
                    />
                  ) : (
                    <SlideOverlayControlsDesktop
                      slide={slide}
                      sectionTheme={t}
                      setSlide={(patch) => updateSlide(slide.id, patch)}
                    />
                  )}
                </div>
              )}
            </>
          )}
        />
      </Group>

      <Group title="Slide defaults" value="slide-defaults">
        <p
          className="text-xs text-slate-500 -mt-1 mb-1 leading-snug"
          data-testid="hero-slide-defaults-help"
        >
          These values apply to every slide as a baseline. Many can be
          overridden inside an individual slide.
        </p>
        <ColorField
          label="Title color"
          value={t.titleColor}
          onChange={(v) => setTheme({ titleColor: v })}
          testid="hero-title-color"
        />
        <ColorField
          label="Subtitle color"
          value={t.subtitleColor}
          onChange={(v) => setTheme({ subtitleColor: v })}
          testid="hero-subtitle-color"
        />
        <ColorField
          label="Button bg"
          value={t.ctaBg}
          onChange={(v) => setTheme({ ctaBg: v })}
          testid="hero-cta-bg"
        />
        <ColorField
          label="Button text"
          value={t.ctaText}
          onChange={(v) => setTheme({ ctaText: v })}
          testid="hero-cta-text"
        />
        <div className="pt-2 border-t border-slate-200 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Default overlay
          </p>
          <p className="text-[11px] text-slate-500 mb-2 leading-snug">
            Tints applied on top of every slide&apos;s image. Individual
            slides can override these under &quot;Slides → Overlay
            (this slide)&quot;.
          </p>
          {previewMode === "mobile" ? (
            <OverlayControlsMobile theme={t} setTheme={setTheme} />
          ) : (
            <OverlayControlsDesktop theme={t} setTheme={setTheme} />
          )}
        </div>
        <div className="pt-2 border-t border-slate-200 mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Layout
          </p>
          {previewMode === "mobile" ? (
            <LayoutControlsMobile layout={l} setLayout={setLayout} />
          ) : (
            <LayoutControlsDesktop layout={l} setLayout={setLayout} />
          )}
        </div>
      </Group>

      {/* Section-wide "Split panel design" group was retired in favour
        * of per-slide controls. The renderer still reads
        * `cfg.layout.imageSide / panelRatio / mobileImagePanelGap` and
        * `cfg.theme.panelBgType*` as defaults if individual slides
        * don't override — so legacy saved sections render identically.
        * Editing now happens inside each split slide's own form. */}

      {/* Carousel controls were merged into "Section / Carousel" at
        * the top of the form. This bottom slot is intentionally empty;
        * left as a comment so reviewers see the intent rather than
        * wondering where the carousel group went. */}
    </FormAccordion>
  );
}

export const hero = {
  id: ID,
  name: "Hero",
  description: "Full-width slideshow — slide or fade transition",
  icon: GalleryHorizontalEnd,
  defaults,
  render,
  FormPanel,
};
