/**
 * Studio Page Editor — admin-only Studio chrome over the existing
 * PageEditor. PageEditor's layout was already a 3-pane workspace
 * (PageRail · BlockEditorDrawer · Canvas) so the only thing the
 * Studio variant changes is the top header bar via PageEditor's
 * `studio` prop. State management, autosave, block CRUD, page
 * preview and the "Save as template" dialog are all unchanged.
 */
import PageEditor from "@/pages/PageEditor";

export default function StudioPageEditor() {
  return <PageEditor studio />;
}
