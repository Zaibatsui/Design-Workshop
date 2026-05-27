import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Link2Off,
  Underline as UnderlineIcon,
  X,
} from "lucide-react";

/**
 * Custom Link extension —
 *   • Preserves any inline `style="..."` the user pastes (lets pasted
 *     CMS-ready HTML round-trip cleanly through the visual editor).
 *   • Carries a `data-no-underline` flag for per-link underline removal.
 *     The rendered snippet's CSS targets `a[data-no-underline]` so any
 *     section that includes this extension can opt-out of the underline
 *     per link without a section-level toggle.
 */
const StyledLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
      "data-no-underline": {
        default: null,
        parseHTML: (el) =>
          el.getAttribute("data-no-underline") === "true" ? "true" : null,
        renderHTML: (attrs) =>
          attrs["data-no-underline"] === "true"
            ? { "data-no-underline": "true" }
            : {},
      },
    };
  },
});

/**
 * Parses an existing href back into the link-panel form fields. Mailto URLs
 * split into address + ?subject= + &body=; everything else is treated as a
 * Web link. Returns `null` when href is empty.
 */
function parseHref(href) {
  if (!href) return null;
  if (href.startsWith("mailto:")) {
    const rest = href.slice("mailto:".length);
    const [emailPart, queryPart] = rest.split("?");
    const params = new URLSearchParams(queryPart || "");
    return {
      type: "email",
      email: decodeURIComponent(emailPart || ""),
      subject: params.get("subject") || "",
      body: params.get("body") || "",
      url: "",
    };
  }
  return { type: "web", url: href, email: "", subject: "", body: "" };
}

/** Builds an href string from the link-panel form state. */
function buildHref(form) {
  if (form.type === "email") {
    const e = (form.email || "").trim();
    if (!e) return "";
    const qs = new URLSearchParams();
    if (form.subject) qs.set("subject", form.subject);
    if (form.body) qs.set("body", form.body);
    const tail = qs.toString();
    return `mailto:${e}${tail ? `?${tail}` : ""}`;
  }
  return (form.url || "").trim();
}

const EMPTY_FORM = {
  type: "web",
  url: "",
  email: "",
  subject: "",
  body: "",
};

/**
 * Minimal Tiptap WYSIWYG used in the Rich Text block and FAQ answers.
 *
 * `tools` subsets the toolbar buttons. Defaults to the full set; pass
 * e.g. `["bold","italic","ul","ol","link"]` for a compact inline editor.
 *
 * Link UX: clicking the link button opens an inline panel under the
 * toolbar (Web URL or Email with optional subject/body). When the cursor
 * is on a link, an additional "remove underline" toggle appears in the
 * toolbar so an author can strip the default underline on a single link
 * without affecting the rest of the section.
 */
export default function RichTextEditor({ html, onChange, tools }) {
  const enabled =
    tools && tools.length
      ? new Set(tools)
      : new Set(["h1", "h2", "h3", "bold", "italic", "ul", "ol", "link"]);

  const [linkPanel, setLinkPanel] = useState({ open: false, form: EMPTY_FORM });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      StyledLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: html || "",
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3 text-slate-900",
        "data-testid": "richtext-editor",
      },
    },
  });

  // Keep editor content in sync if the parent swaps the block. Only replace
  // when truly different to avoid clobbering the user's live edits.
  useEffect(() => {
    if (!editor) return;
    if (html === editor.getHTML()) return;
    editor.commands.setContent(html || "", { emitUpdate: false });
  }, [html, editor]);

  if (!editor) return null;

  const openLinkPanel = () => {
    const existing = editor.getAttributes("link").href || "";
    const parsed = parseHref(existing);
    setLinkPanel({
      open: true,
      form: parsed || EMPTY_FORM,
    });
  };

  const closeLinkPanel = () => setLinkPanel({ open: false, form: EMPTY_FORM });

  const saveLink = () => {
    const href = buildHref(linkPanel.form);
    if (!href) {
      // Nothing to save — treat as cancel.
      closeLinkPanel();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href })
      .run();
    closeLinkPanel();
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    closeLinkPanel();
  };

  const toggleLinkUnderline = () => {
    // Only meaningful when cursor is inside a link mark.
    if (!editor.isActive("link")) return;
    const current = editor.getAttributes("link")["data-no-underline"];
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .updateAttributes("link", {
        "data-no-underline": current === "true" ? null : "true",
      })
      .run();
  };

  const setForm = (patch) =>
    setLinkPanel((s) => ({ ...s, form: { ...s.form, ...patch } }));

  const onLink = editor.isActive("link");
  const noUnderline =
    editor.getAttributes("link")["data-no-underline"] === "true";
  const canSave = Boolean(buildHref(linkPanel.form));

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
        {enabled.has("h1") && (
          <ToolbarButton
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            label="H1"
            testid="rt-h1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("h2") && (
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            label="H2"
            testid="rt-h2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("h3") && (
          <ToolbarButton
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            label="H3"
            testid="rt-h3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        )}
        {(enabled.has("h1") || enabled.has("h2") || enabled.has("h3")) && <Divider />}
        {enabled.has("bold") && (
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
            testid="rt-bold"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("italic") && (
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
            testid="rt-italic"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
        )}
        {(enabled.has("bold") || enabled.has("italic")) && <Divider />}
        {enabled.has("ul") && (
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Bullet list"
            testid="rt-ul"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("ol") && (
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="Numbered list"
            testid="rt-ol"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        )}
        {(enabled.has("ul") || enabled.has("ol")) && enabled.has("link") && <Divider />}
        {enabled.has("link") && (
          <ToolbarButton
            active={onLink || linkPanel.open}
            onClick={() => (linkPanel.open ? closeLinkPanel() : openLinkPanel())}
            label="Link"
            testid="rt-link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("link") && onLink && (
          <ToolbarButton
            onClick={removeLink}
            label="Remove link"
            testid="rt-unlink"
          >
            <Link2Off className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("link") && onLink && (
          <ToolbarButton
            active={!noUnderline}
            onClick={toggleLinkUnderline}
            label={noUnderline ? "Underline this link" : "Remove underline from this link"}
            testid="rt-link-underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
      </div>

      {linkPanel.open && (
        <LinkPanel
          form={linkPanel.form}
          setForm={setForm}
          onClose={closeLinkPanel}
          onSave={saveLink}
          canSave={canSave}
        />
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Inline link-editor panel rendered between the toolbar and the editor
 * body. Switches between Web and Email modes; the latter exposes the
 * three classic mailto fields (address, subject, body) and emits a
 * `mailto:` href on save.
 */
function LinkPanel({ form, setForm, onClose, onSave, canSave }) {
  const isEmail = form.type === "email";
  return (
    <div
      data-testid="rt-link-panel"
      className="px-3 py-3 border-b border-slate-200 bg-slate-50/60 space-y-2"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold tracking-wide text-slate-700">
          Text link
        </h4>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close link panel"
          data-testid="rt-link-panel-close"
          className="p-0.5 text-slate-500 hover:text-slate-900"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1">
        <label className="block text-[11px] font-medium text-slate-600">
          Link to
        </label>
        <select
          data-testid="rt-link-type"
          value={form.type}
          onChange={(e) => setForm({ type: e.target.value })}
          className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
        >
          <option value="web">Web</option>
          <option value="email">Email</option>
        </select>
      </div>
      {isEmail ? (
        <>
          <Field
            label="Email address"
            placeholder="email@company.com"
            value={form.email}
            onChange={(v) => setForm({ email: v })}
            testid="rt-link-email"
            type="email"
          />
          <Field
            label="Message subject (optional)"
            value={form.subject}
            onChange={(v) => setForm({ subject: v })}
            testid="rt-link-subject"
          />
          <Field
            label="Message body (optional)"
            value={form.body}
            onChange={(v) => setForm({ body: v })}
            testid="rt-link-body"
            multiline
          />
        </>
      ) : (
        <Field
          label="URL"
          placeholder="https://example.com"
          value={form.url}
          onChange={(v) => setForm({ url: v })}
          testid="rt-link-url"
        />
      )}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          data-testid="rt-link-cancel"
          className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          data-testid="rt-link-save"
          className="text-xs font-medium px-3 py-1.5 rounded bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, testid, multiline, type }) {
  const cls =
    "w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-slate-400";
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium text-slate-600">
        {label}
      </label>
      {multiline ? (
        <textarea
          data-testid={testid}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className={cls}
        />
      ) : (
        <input
          data-testid={testid}
          type={type || "text"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function ToolbarButton({ active, onClick, label, testid, children }) {
  return (
    <button
      type="button"
      data-testid={testid}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded text-slate-600 hover:bg-slate-100 transition-colors ${
        active ? "bg-slate-200 text-slate-900" : ""
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-slate-200 mx-1" aria-hidden="true" />;
}
