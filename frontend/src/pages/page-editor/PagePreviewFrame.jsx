/**
 * PagePreviewFrame — sandboxed iframe rendering the composed page snippet.
 * Height scales with block count because the preview content can be
 * arbitrarily tall (user scrolls inside the iframe for the real rendered
 * height of their page).
 */
export default function PagePreviewFrame({ doc, blockCount }) {
  const h = Math.max(640, blockCount * 320);
  return (
    <iframe
      data-testid="page-preview-iframe"
      title="Page preview"
      srcDoc={doc}
      sandbox="allow-scripts allow-same-origin"
      className="w-full block border-0"
      style={{ height: `${h}px` }}
    />
  );
}
