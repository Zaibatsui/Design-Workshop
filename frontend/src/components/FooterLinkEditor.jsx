/**
 * FooterLinkEditor — single reusable editor control for the optional
 * "secondary text link" affordance (e.g. "Already have an account?
 * Sign in to continue →") shipped on multiple section types.
 *
 * Stores its value at `config.footerLink = { prefix, label, href,
 * openInNewTab, arrowImage, tintArrow }`. Pair on the render side with
 * `footerLinkHtml(cfg, align)` from `shared.js`.
 *
 * The `arrowImage` field uses the standard ImageUpload control so users
 * get the same three-source picker (upload / paste URL / pick from
 * library) they're used to from every other image field in the editor.
 *
 * When `tintArrow` is turned on with a cross-origin URL, the snippet's
 * CSS `mask-image` rule would normally fail because most image CDNs
 * don't send `Access-Control-Allow-Origin`. To make this seamless, we
 * call the backend `inlineImage` proxy to fetch the resource server-
 * side and rewrite the field as a CORS-safe `data:` URI. The user just
 * sees "the toggle works"; no upload step required.
 */
import { useState } from "react";
import { toast } from "sonner";
import { FormGroup as Group } from "@/components/FormGroup";
import { TextField, ToggleField } from "@/components/FormFields";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

// True for any URL that points outside the editor's own origin AND isn't
// already inlined. Same-origin uploads and data URIs don't need proxying.
function needsInlining(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:")) return false;
  // Relative URLs (e.g. /uploads/xyz.svg from our own backend) are same-origin.
  if (url.startsWith("/")) return false;
  try {
    const u = new URL(url, window.location.href);
    return u.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export default function FooterLinkEditor({
  value,
  onChange,
  testidPrefix = "footer-link",
  title = "Footer link (optional)",
}) {
  const fl = value || {};
  const set = (patch) => onChange({ ...fl, ...patch });
  const [inlining, setInlining] = useState(false);

  const hasLabel = (fl.label || "").trim().length > 0;
  const hasHref = (fl.href || "").trim().length > 0;
  const wouldShow = hasLabel && hasHref;

  const handleTintToggle = async (next) => {
    // Just turning it off — no inlining needed.
    if (!next) {
      set({ tintArrow: false });
      return;
    }
    // Turning it on with a cross-origin URL → proxy through backend so
    // CSS mask doesn't silently fail on the live snippet.
    if (needsInlining(fl.arrowImage)) {
      setInlining(true);
      try {
        const { dataUri } = await api.inlineImage(fl.arrowImage);
        set({ tintArrow: true, arrowImage: dataUri });
        toast.success("Arrow inlined — colour matching now works.");
      } catch (err) {
        const detail = (err && err.message) || "Could not inline the image.";
        toast.error(`Couldn't inline image: ${detail.slice(0, 140)}`);
        // Leave tint OFF — clearer than enabling a broken state.
      } finally {
        setInlining(false);
      }
      return;
    }
    // Same-origin URL or already a data URI → no proxy needed.
    set({ tintArrow: true });
  };

  return (
    <Group title={title}>
      <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-900 leading-relaxed">
        Both a <strong>Link label</strong> and a <strong>URL</strong> must be
        filled in before the link appears in the preview.
        {wouldShow ? null : (
          <span className="block mt-1 text-blue-700">
            Currently hidden — fill in the fields below to see it render.
          </span>
        )}
      </div>
      <TextField
        label="Prefix (optional)"
        placeholder="Already have an account?"
        value={fl.prefix || ""}
        onChange={(v) => set({ prefix: v })}
        testid={`${testidPrefix}-prefix`}
      />
      <TextField
        label="Link label"
        placeholder="Sign in to continue"
        value={fl.label || ""}
        onChange={(v) => set({ label: v })}
        testid={`${testidPrefix}-label`}
      />
      <TextField
        label="URL"
        placeholder="https://example.com/login"
        value={fl.href || ""}
        onChange={(v) => set({ href: v })}
        testid={`${testidPrefix}-href`}
      />
      <ToggleField
        label="Open in new tab"
        checked={!!fl.openInNewTab}
        onChange={(v) => set({ openInNewTab: v })}
        testid={`${testidPrefix}-newtab`}
      />
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Custom arrow (optional)
        </Label>
        <p className="text-xs text-slate-500 mt-1 mb-2">
          Leave empty to use the default <span aria-hidden="true">→</span>{" "}
          glyph. Upload an image, paste a URL, or pick from your library.
        </p>
        <ImageUpload
          value={fl.arrowImage || ""}
          onChange={(v) => {
            // Changing the image clears the inlined cache state — the new
            // URL might be same-origin and not need inlining; or it might
            // be a fresh cross-origin URL that needs re-inlining the next
            // time tint is toggled on.
            set({ arrowImage: v });
          }}
          testid={`${testidPrefix}-arrow`}
          compact
        />
        {fl.arrowImage ? (
          <div className="mt-2 flex items-center gap-2">
            <ToggleField
              label="Match link colour"
              description="Tints the arrow to match the link colour (works best with single-colour PNG / SVG icons on a transparent background)."
              checked={!!fl.tintArrow}
              onChange={handleTintToggle}
              testid={`${testidPrefix}-arrow-tint`}
            />
            {inlining ? (
              <span
                className="inline-flex items-center gap-1 text-xs text-slate-500"
                data-testid={`${testidPrefix}-arrow-inlining`}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Inlining…
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Group>
  );
}
