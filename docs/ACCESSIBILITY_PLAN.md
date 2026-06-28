# Accessibility plan — ARIA roll-out

**Status:** Parked (2026-02-19). User has chosen to focus on other areas first; revisit when ready.

**Goal:** Bring every section's snippet output to WCAG 2.1 AA on the structural side (roles + properties + states) and add keyboard navigation to the three interactive sections (Tabs, Hero carousel, FAQ accordion).

---

## Effort estimate

| Section | Effort | What's needed |
|---|---|---|
| **Tabs** | ~1 hr | `role="tablist"` on the button row, `role="tab"` + `aria-selected` + `aria-controls` + `tabindex="0/-1"` on each button, `role="tabpanel"` + `aria-labelledby` on each panel. Plus **keyboard nav** in the IIFE — Arrow ←/→, Home/End. |
| **Hero (carousel)** | ~45 min | `role="region" aria-roledescription="carousel" aria-label="<heading>"` on section root; prev/next buttons `aria-label`; dots `aria-label="Go to slide N"`; slides `role="group" aria-roledescription="slide" aria-label="N of M"`. `aria-live="polite"` on slides container when autoplay is off. |
| **FAQ (accordion)** | ~30 min | Each question `<button>` needs `aria-expanded` + `aria-controls`; each answer panel `role="region" aria-labelledby`. Verify the toggle IIFE updates `aria-expanded` on click. |
| **Brand Grid** | ~10 min | Search input already has `aria-label`. Add a polite `aria-live` count when search filters cards ("3 matches"). |
| **Logos (marquee)** | ~20 min | Add `aria-label` on the section + `prefers-reduced-motion` media query that freezes the marquee (WCAG 2.3.3 — auto-scrolling content must be pauseable). |
| **CTA Banner / Split Banner / Welcome / Feature Grid / Product Grid / Resources / Insights / Steps / Stat Counter / Trust Strip / Comparison Table / Featured Card / Break / Video Embed** | 5–15 min each | Sweep for missing `alt` on decorative images, icon-only button labels, form labels in the email-capture CTA. Mostly static semantic HTML already. |

**Grand total: roughly 1 working day** for the markup pass + 2 hours keyboard support + 1 hour regression test.

---

## Why it's manageable

1. Snippets are pure HTML template literals — no React virtual-DOM gymnastics.
2. Every section already has a unique `cls = ns-<type>-<uid>` so stable IDs like `${cls}-tab-${i}` / `${cls}-panel-${i}` are trivial.
3. The existing IIFEs already mutate DOM state on click (Tabs toggles `is-active`, FAQ toggles `is-open`) — adding `aria-expanded` / `aria-selected` updates in the same handlers is a 2-line change per section.
4. No new dependencies — pure markup work, no React ARIA libs needed.

---

## SEO benefit

Real, but secondary to UX. Lighthouse accessibility is an SEO-adjacent ranking signal and semantic markup helps the document outline (which affects featured-snippet eligibility). The bigger SEO wins from this work tend to be:
- Proper heading hierarchy (mostly already correct in our sections)
- Image `alt` text discipline (sweep would catch the gaps)
- Skip-link / landmark roles at the *page* level (separate from sections)

---

## Suggested order when picked up

1. **Tabs first** — highest user-facing impact, biggest accessibility gap today.
2. **Hero carousel** — second most-used interactive section.
3. **FAQ** — quick win.
4. **Static sweep** — batch the remaining 16 sections in one PR with a new `accessibility.smoke.test.js` guard so nothing regresses.

---

## Guardrail for new / updated sections

**When building or updating any section that includes interactive controls (buttons, toggles, accordion headers, tabs, carousels, dialog triggers), the renderer MUST emit the appropriate ARIA attributes from day one.** This includes:

- Real `<button>` elements (never `<div role="button">`)
- `aria-label` on icon-only buttons
- `aria-expanded` / `aria-selected` / `aria-pressed` state attributes wired through the IIFE
- `aria-controls` pointing at the controlled region's ID (use `${cls}-…` for uniqueness)
- `alt` on every `<img>` (use `alt=""` for purely decorative images)
- Form inputs always paired with `<label for>` or `aria-label`

A short reviewer checklist for PRs touching a section's `render()`:
- [ ] Every interactive element is a real semantic tag (`<button>`, `<a>`, `<input>`)
- [ ] Every icon-only button has an `aria-label`
- [ ] State changes (open / selected / pressed) update the matching ARIA attribute in the IIFE
- [ ] Every `<img>` carries an `alt` (empty string allowed for decoration)
- [ ] No new auto-scrolling / auto-playing animation without a `prefers-reduced-motion: reduce` opt-out
