/**
 * Regression: the page editor's BlockEditorDrawer must forward
 * `previewMode` to both the section's `FormPanel` and the
 * `StudioInspector`. Several sections (Hero, Split Banner, Content,
 * CTA Banner, Feature Grid, Product Grid, Welcome) gate mobile-only
 * UI fields behind `previewMode === "mobile"` — without this prop the
 * fields are hidden when editing the same section from inside a page,
 * even though the section editor surfaces them.
 *
 * PageEditor must also pass its `previewWidth` state down as
 * `previewMode` so the viewport toggle flows through.
 */
const fs = require("fs");
const path = require("path");

const read = (p) => fs.readFileSync(path.join(__dirname, p), "utf8");
const pageEditor = read("../../pages/PageEditor.jsx");
const drawer = read("../../pages/page-editor/BlockEditorDrawer.jsx");

let passed = 0;
let failed = 0;
function expect(label, cond) {
  if (cond) {
    console.log("PASS ·", label);
    passed++;
  } else {
    console.error("FAIL ·", label);
    failed++;
  }
}

// PageEditor → BlockEditorDrawer prop wiring (both Classic + Studio
// drawer mounts must forward the viewport state).
const pageEditorForwards = (pageEditor.match(/previewMode=\{previewWidth\}/g) || []).length;
expect(
  "PageEditor passes previewMode={previewWidth} to BOTH drawer mounts",
  pageEditorForwards >= 2
);

// Drawer signature accepts previewMode and forwards to BOTH StudioInspector
// AND the classic-mode FormPanel.
expect(
  "BlockEditorDrawer accepts previewMode as a prop",
  /export default function BlockEditorDrawer\([\s\S]{0,400}previewMode,/m.test(
    drawer
  )
);
expect(
  "StudioInspector receives previewMode={previewMode}",
  /<StudioInspector[\s\S]{0,400}previewMode=\{previewMode\}/.test(drawer)
);
expect(
  "Classic-mode <def.FormPanel> receives previewMode={previewMode}",
  /<def\.FormPanel[\s\S]{0,400}previewMode=\{previewMode\}/.test(drawer)
);

console.log(`\n${failed === 0 ? "ALL PASSED" : "FAILED"} (${passed} passed, ${failed} failed)`);
if (failed > 0) process.exit(1);
