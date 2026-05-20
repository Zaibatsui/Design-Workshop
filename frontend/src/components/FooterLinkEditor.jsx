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

// Any URL that isn't already a data: URI needs inlining when tint is
// enabled — *including* same-origin uploads — because the snippet runs
// on the customer's host site (Nettailer etc), which is cross-origin to
// our server. Without inlining, CSS mask-image would silently fail there
// AND the snippet would depend on our server staying up to serve the
// arrow. Inlining as data: removes both problems.
function needsInlining(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:")) return false;
  return true;
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

  const handleArrowChange = async (newUrl) => {
    // Empty / cleared → just save.
    if (!newUrl || !needsInlining(newUrl)) {
      set({ arrowImage: newUrl });
      return;
    }
    // Any non-data URL gets inlined immediately so the snippet stays
    // self-contained — works even if our server is offline once the
    // customer has pasted the snippet into their host site.
    setInlining(true);
    try {
      const { dataUri } = await api.inlineImage(newUrl);
      set({ arrowImage: dataUri });
    } catch (err) {
      const detail = (err && err.message) || "Could not inline the image.";
      toast.error(`Couldn't inline image: ${detail.slice(0, 140)}`);
      // Fall back to storing the raw URL so the user isn't stuck — the
      // snippet will still work, it just won't be server-independent.
      set({ arrowImage: newUrl });
    } finally {
      setInlining(false);
    }
  };

  const handleTintToggle = (next) => {
    // Inlining is handled at upload time; the toggle is now just a flag.
    set({ tintArrow: !!next });
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
          onChange={handleArrowChange}
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
