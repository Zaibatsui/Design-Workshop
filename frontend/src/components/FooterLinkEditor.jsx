/**
 * FooterLinkEditor — single reusable editor control for the optional
 * "secondary text link" affordance (e.g. "Already have an account?
 * Sign in to continue →") shipped on multiple section types.
 *
 * Stores its value at `config.footerLink = { prefix, label, href, openInNewTab }`.
 * Pair on the render side with `footerLinkHtml(cfg, align)` from `shared.js`.
 */
import { FormGroup as Group } from "@/components/FormGroup";
import { TextField, ToggleField } from "@/components/FormFields";

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
    </Group>
  );
}
