/**
 * FooterLinkEditor — single reusable editor control for the optional
 * "secondary text link" affordance (e.g. "Already have an account?
 * Sign in to continue →") shipped on multiple section types.
 *
 * Stores its value at `config.footerLink = { prefix, label, href,
 * openInNewTab, arrowImage }`. Pair on the render side with
 * `footerLinkHtml(cfg, align)` from `shared.js`.
 *
 * The `arrowImage` field uses the standard ImageUpload control so
 * users get the same three-source picker (upload / paste URL / pick
 * from internal library) they're used to from every other image
 * field in the editor. When empty, the default `→` glyph is used.
 */
import { FormGroup as Group } from "@/components/FormGroup";
import { TextField, ToggleField } from "@/components/FormFields";
import ImageUpload from "@/components/ImageUpload";
import { Label } from "@/components/ui/label";

export default function FooterLinkEditor({
  value,
  onChange,
  testidPrefix = "footer-link",
  title = "Footer link (optional)",
}) {
  const fl = value || {};
  const set = (patch) => onChange({ ...fl, ...patch });
  return (
    <Group title={title}>
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
          Leave empty to use the default <span aria-hidden="true">→</span> glyph.
          Upload an image, paste a URL, or pick from your library.
        </p>
        <ImageUpload
          value={fl.arrowImage || ""}
          onChange={(v) => set({ arrowImage: v })}
          testid={`${testidPrefix}-arrow`}
          compact
        />
      </div>
    </Group>
  );
}
