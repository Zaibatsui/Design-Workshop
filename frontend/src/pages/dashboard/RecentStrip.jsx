/**
 * RecentStrip — a compact "jump back in" row at the top of the
 * dashboard. Shows the 5 most recently edited items across both
 * sections and pages, with a mini live preview, type badge, title and
 * timeAgo. Click an item → navigate straight into its editor.
 *
 * Wraps and centers rather than scrolling horizontally — fixed-width
 * tiles at the max item count don't reliably fit one row at every
 * viewport width, and a horizontal-scroll strip for 5 items reads as a
 * bug more than a feature.
 *
 * Each tile reuses the same iframe scale/visibility hook as the grid so
 * previews hydrate lazily and shrink-wrap to real content height.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FileStack, Layers } from "lucide-react";
import { SECTIONS_BY_ID } from "@/sections/registry";
import { previewDoc, makeUid } from "@/sections/shared";
import { composePage } from "@/sections/pageSnippet";
import {
  PREVIEW_INTERNAL_HEIGHT,
  PREVIEW_INTERNAL_WIDTH,
  timeAgo,
  useIframeScale,
} from "./common";

const MAX_ITEMS = 5;

export default function RecentStrip({ sections, pages }) {
  const recents = useMemo(() => {
    const combined = [
      ...sections.map((s) => ({
        kind: "section",
        id: s.section_id,
        item: s,
        updated_at: s.updated_at,
      })),
      ...pages.map((p) => ({
        kind: "page",
        id: p.page_id,
        item: p,
        updated_at: p.updated_at,
      })),
    ];
    combined.sort((a, b) => {
      const ta = new Date(a.updated_at).getTime() || 0;
      const tb = new Date(b.updated_at).getTime() || 0;
      return tb - ta;
    });
    return combined.slice(0, MAX_ITEMS);
  }, [sections, pages]);

  if (recents.length === 0) return null;

  return (
    <div className="mb-8" data-testid="recent-strip">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-heading text-sm font-semibold tracking-tight text-slate-700">
          Recently edited
        </h2>
        <span className="text-xs text-slate-400">
          Jump back in · {recents.length} item{recents.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {recents.map((r) =>
          r.kind === "section" ? (
            <RecentSectionTile key={`s-${r.id}`} section={r.item} />
          ) : (
            <RecentPageTile key={`p-${r.id}`} page={r.item} />
          )
        )}
      </div>
    </div>
  );
}

function RecentSectionTile({ section }) {
  const def = SECTIONS_BY_ID[section.type];
  const { wrapRef, iframeRef, scale, contentHeight, visible } = useIframeScale();
  const doc = useMemo(() => {
    if (!def) return "";
    return previewDoc(def.render({ ...section.config, uid: makeUid() }));
  }, [def, section.config]);

  if (!def) return null;
  const Icon = def.icon || Layers;
  return (
    <TileFrame
      to={`/edit/section/${section.section_id}`}
      testId={`recent-section-${section.section_id}`}
      wrapRef={wrapRef}
      Icon={Icon}
      typeLabel={def.name}
      name={section.name}
      updated={section.updated_at}
      scale={scale}
      contentHeight={contentHeight}
      visible={visible}
      iframeRef={iframeRef}
      doc={doc}
      iframeTitle={section.name}
    />
  );
}

function RecentPageTile({ page }) {
  const { wrapRef, iframeRef, scale, contentHeight, visible } = useIframeScale();
  const snippet = useMemo(() => composePage(page.blocks || []), [page.blocks]);
  const doc = useMemo(() => previewDoc(snippet), [snippet]);
  const blockCount = (page.blocks || []).length;
  return (
    <TileFrame
      to={`/edit/page/${page.page_id}`}
      testId={`recent-page-${page.page_id}`}
      wrapRef={wrapRef}
      Icon={FileStack}
      typeLabel={`Page · ${blockCount} block${blockCount === 1 ? "" : "s"}`}
      name={page.name}
      updated={page.updated_at}
      scale={scale}
      contentHeight={contentHeight}
      visible={visible && blockCount > 0}
      iframeRef={iframeRef}
      doc={doc}
      iframeTitle={page.name}
    />
  );
}

// Fixed-size tile (240×160 preview). Centers on big screens, snaps on
// touch scroll, and reuses the same lazy-iframe pattern as the grid.
const TILE_WIDTH = 240;
const TILE_PREVIEW_HEIGHT = 140;

function TileFrame({
  to,
  testId,
  wrapRef,
  Icon,
  typeLabel,
  name,
  updated,
  scale,
  contentHeight,
  visible,
  iframeRef,
  doc,
  iframeTitle,
}) {
  // The tile preview has a fixed height so the strip stays horizontally
  // uniform. We still scale the iframe to the tile's width, and crop the
  // bottom with overflow-hidden so very-tall sections read as "top of
  // the section" thumbnails.
  const iframeHeight = contentHeight || PREVIEW_INTERNAL_HEIGHT;
  return (
    <Link
      to={to}
      data-testid={testId}
      className="flex-shrink-0 group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all"
      style={{ width: `${TILE_WIDTH}px` }}
    >
      <div
        ref={wrapRef}
        className="relative bg-slate-100 overflow-hidden w-full"
        style={{ height: `${TILE_PREVIEW_HEIGHT}px` }}
      >
        {visible && doc ? (
          <iframe
            ref={iframeRef}
            title={iframeTitle}
            srcDoc={doc}
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            className="border-0 pointer-events-none block absolute top-0 left-0"
            style={{
              width: `${PREVIEW_INTERNAL_WIDTH}px`,
              height: `${iframeHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
          <Icon className="w-3 h-3" />
          <span className="truncate">{typeLabel}</span>
        </div>
        <p className="text-[13px] font-medium text-slate-900 truncate leading-tight">
          {name}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {timeAgo(new Date(updated))}
        </p>
      </div>
    </Link>
  );
}
