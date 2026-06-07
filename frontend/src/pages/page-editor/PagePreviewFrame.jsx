/**
 * PagePreviewFrame — sandboxed iframe rendering the composed page snippet.
 * Height scales with block count because the preview content can be
 * arbitrarily tall (user scrolls inside the iframe for the real rendered
 * height of their page).
 *
 * Also forwards the editor-side `ns-editor-focus-item` window event into
 * the iframe as a postMessage so that when the user expands a list row
 * in the inspector (e.g. opens product card #3 in the ListEditor), the
 * preview smoothly scrolls to that card. Mirrors the same hook in
 * `<PreviewFrame>` from EditorBits so both editors close the
 * click-to-edit loop bidirectionally.
 */
import { useEffect, useRef } from "react";

export default function PagePreviewFrame({ doc, blockCount }) {
  const h = Math.max(640, blockCount * 320);
  const iframeRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const f = iframeRef.current;
      if (!f || !f.contentWindow) return;
      const d = e.detail || {};
      f.contentWindow.postMessage(
        { type: "ns-focus-item", list: d.list, index: d.index },
        "*"
      );
    };
    window.addEventListener("ns-editor-focus-item", handler);
    return () => window.removeEventListener("ns-editor-focus-item", handler);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      data-testid="page-preview-iframe"
      title="Page preview"
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin"
      className="w-full block border-0"
      style={{ height: `${h}px` }}
    />
  );
}
