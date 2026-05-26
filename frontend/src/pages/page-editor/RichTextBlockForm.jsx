/**
 * RichTextBlockForm — drawer form for a richtext block. Switches between
 * the tiptap WYSIWYG editor (Visual mode) and a raw HTML textarea (Source
 * mode). Layout + colors are the same in either mode.
 */
import ColorField from "@/components/ColorField";
import {
  SelectField,
  ToggleField,
} from "@/components/FormFields";
import PaddingFields from "@/components/PaddingFields";
import RichTextEditor from "@/components/RichTextEditor";

export default function RichTextBlockForm({ block, onUpdate }) {
  const cfg = block.config || {};
  const setCfg = (patch) => onUpdate({ config: patch });
  const mode = cfg.mode || "visual";

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit"
        data-testid="rt-mode-toggle"
      >
        <ModeTab
          active={mode === "visual"}
          onClick={() => setCfg({ mode: "visual" })}
          testid="rt-mode-visual"
        >
          Visual
        </ModeTab>
        <ModeTab
          active={mode === "source"}
          onClick={() => setCfg({ mode: "source" })}
          testid="rt-mode-source"
        >
          HTML source
        </ModeTab>
      </div>
      {mode === "source" ? (
        <SourceEditor cfg={cfg} onChange={(html) => setCfg({ html })} />
      ) : (
        <RichTextEditor
          html={cfg.html || ""}
          onChange={(html) => setCfg({ html })}
        />
      )}
      <LayoutFields cfg={cfg} setCfg={setCfg} />
      <ColorFields cfg={cfg} setCfg={setCfg} />
    </div>
  );
}

function SourceEditor({ cfg, onChange }) {
  return (
    <div>
      <textarea
        data-testid="rt-source-textarea"
        value={cfg.html || ""}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="w-full h-64 p-3 font-mono text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:border-[#E01839] resize-y bg-slate-50"
        placeholder="<section>Paste any HTML — script, iframe, inline handlers all allowed.</section>"
      />
      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
        Raw HTML renders verbatim. Scripts and iframes will execute in the
        preview and in the exported snippet.
      </p>
    </div>
  );
}

function LayoutFields({ cfg, setCfg }) {
  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Layout
      </h3>
      <PaddingFields
        config={{ ...cfg, paddingY: cfg.paddingY ?? cfg.padY }}
        onUpdate={setCfg}
        defaultValue={48}
        min={0}
        max={160}
        testidPrefix="rt"
      />
      <SelectField
        label="Alignment"
        value={cfg.align || "left"}
        onChange={(v) => setCfg({ align: v })}
        options={[
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
        ]}
        testid="rt-align"
      />
      <ToggleField
        label="Full-bleed background"
        checked={!!cfg.fullBleed}
        onChange={(v) => setCfg({ fullBleed: v })}
        testid="rt-fullbleed"
      />
    </div>
  );
}

function ColorFields({ cfg, setCfg }) {
  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        Colors
      </h3>
      <ColorField
        label="Background"
        value={cfg.bg || "#ffffff"}
        onChange={(v) => setCfg({ bg: v })}
        testid="rt-bg"
      />
      <ColorField
        label="Text"
        value={cfg.fg || "#1f2937"}
        onChange={(v) => setCfg({ fg: v })}
        testid="rt-fg"
      />
      <ColorField
        label="Link / accent"
        value={cfg.accent || "#E01839"}
        onChange={(v) => setCfg({ accent: v })}
        testid="rt-accent"
      />
    </div>
  );
}

function ModeTab({ active, onClick, testid, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testid}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
