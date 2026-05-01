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

/** Minimal tiptap WYSIWYG — h1/h2/h3, p, b, i, ul/ol, links. */
export default function RichTextEditor({ html, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
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
        <ToolbarButton
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          label="H1"
          testid="rt-h1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          label="H2"
          testid="rt-h2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          label="H3"
          testid="rt-h3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
          testid="rt-bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
          testid="rt-italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
          testid="rt-ul"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Numbered list"
          testid="rt-ol"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <Divider />
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
        {editor.isActive("link") && (
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
