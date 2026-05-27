import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";
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
} from "lucide-react";

// Link extension extended to preserve any inline `style` attribute that the
// user pastes in. Tiptap's default Link only persists `href`, `target` and
// `rel` — pasted `<a style="color:#000;text-decoration:none">` would lose its
// styling on round-trip, which surprises users pasting CMS-ready HTML.
const StyledLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (el) => el.getAttribute("style"),
        renderHTML: (attrs) => (attrs.style ? { style: attrs.style } : {}),
      },
    };
  },
});

/**
 * Minimal tiptap WYSIWYG — h1/h2/h3, p, b, i, ul/ol, links.
 *
 * `tools` lets a caller subset the toolbar buttons. Defaults to the full
 * set; pass e.g. `["bold","italic","ul","ol","link"]` for a compact
 * inline editor (used in FAQ answers).
 */
export default function RichTextEditor({ html, onChange, tools }) {
  const enabled =
    tools && tools.length
      ? new Set(tools)
      : new Set(["h1", "h2", "h3", "bold", "italic", "ul", "ol", "link"]);
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

  // Keep editor content in sync if the parent swaps the block (e.g. selecting
  // a different block in the canvas). Only replace when truly different to
  // avoid clobbering the user's live edits.
  useEffect(() => {
    if (!editor) return;
    if (html === editor.getHTML()) return;
    editor.commands.setContent(html || "", { emitUpdate: false });
  }, [html, editor]);

  if (!editor) return null;

  const btn = (active) =>
    `p-1.5 rounded text-slate-600 hover:bg-slate-100 transition-colors ${
      active ? "bg-slate-200 text-slate-900" : ""
    }`;

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
            active={editor.isActive("link")}
            onClick={() => {
              const previous = editor.getAttributes("link").href || "";
              const url = window.prompt("URL", previous);
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }}
            label="Link"
            testid="rt-link"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        )}
        {enabled.has("link") && editor.isActive("link") && (
          <ToolbarButton
            onClick={() => editor.chain().focus().unsetLink().run()}
            label="Remove link"
            testid="rt-unlink"
          >
            <Link2Off className="w-4 h-4" />
          </ToolbarButton>
        )}
      </div>
      <EditorContent editor={editor} />
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
