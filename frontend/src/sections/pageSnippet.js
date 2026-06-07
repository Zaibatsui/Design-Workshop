/**
 * Page snippet composer.
 *
 * A "page" is an ordered list of blocks. Each block is either:
 *   - { type: "section", section_type, config }
 *   - { type: "richtext", html, ...richtext config fields }
 *
 * Per-block renderers return fully self-contained HTML+CSS+JS snippets.
 * When composing a page we:
 *   1. Render each block with a fresh UID so IIFE state is isolated per block.
 *   2. Dedupe the Poppins @import (only emit it once at the top).
 *   3. Concatenate the resulting fragments in order.
 *
 * The output is a single, paste-anywhere HTML block with the same isolation
 * guarantees as a standalone section snippet.
 */
import { SECTIONS_BY_ID } from "./registry";
import { richtext, stripSnippetFontImport, FONT_IMPORT } from "./richtext";
import { makeUid } from "./shared";

export function renderBlock(block) {
  if (!block) return "";
  if (block.type === "section") {
    const def = SECTIONS_BY_ID[block.section_type];
    if (!def) {
      return `<!-- unknown section type: ${block.section_type} -->`;
    }
    return def.render({ ...(block.config || {}), uid: makeUid() });
  }
  if (block.type === "richtext") {
    return richtext.render({ ...(block.config || {}), uid: makeUid() });
  }
  return "";
}

/**
 * Escape a string for safe embedding inside an HTML attribute value.
 * Block IDs are server-generated UUIDs so they're already safe, but
 * the helper keeps composePage defensive in case a future block-id
 * scheme ever includes user-supplied characters.
 */
function attrEscape(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function composePage(blocks = []) {
  const rendered = blocks.map((b) => {
    const html = renderBlock(b);
    if (!html) return "";
    const id = b?.block_id;
    // Wrap each block in an editor-only marker the click bridge picks
    // up to drive block-selection. The wrapper renders inline-block
    // contents (display:contents) so it has zero layout impact on the
    // rendered snippet — semantically transparent. Browsers that don't
    // support `display:contents` (~all modern do) will see a plain
    // <div> which still works correctly for the click bridge.
    return id
      ? `<div data-ns-block-id="${attrEscape(id)}" style="display:contents">${html}</div>`
      : html;
  }).filter(Boolean);
  if (rendered.length === 0) return "";

  // Keep the font import on the FIRST snippet only.
  const [first, ...rest] = rendered;
  const tail = rest.map(stripSnippetFontImport);
  return [first, ...tail].join("\n");
}

/** Resolve a block to a human-friendly type label for lists/pickers. */
export function blockTypeLabel(block) {
  if (!block) return "";
  if (block.type === "richtext") return "Rich text";
  const def = SECTIONS_BY_ID[block.section_type];
  return def ? def.name : block.section_type || "Section";
}

export { FONT_IMPORT };
