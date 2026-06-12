/**
 * MoveToCollectionMenu — shared "Move to …" dropdown used on every
 * dashboard section + page card. Renders the same options regardless
 * of item type; the parent provides the move handler so this stays
 * agnostic.
 *
 * Footprint: a single small icon button. Click expands a menu that
 * lists every collection (with its colour dot), an "Unfiled" option
 * to remove from any collection, and a "Manage collections…" footer
 * link that opens the management dialog.
 */
import { FolderInput } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { colorDotClass } from "./CollectionsBar";

export default function MoveToCollectionMenu({
  collections,
  currentId,        // The item's existing collection_id (null = unfiled)
  onMove,           // (collectionId | null) => void
  onManage,
  testidPrefix,
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          data-testid={`${testidPrefix}-move`}
          title="Move to collection"
          aria-label="Move to collection"
          className="p-2 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100"
        >
          <FolderInput className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56"
        data-testid={`${testidPrefix}-move-menu`}
      >
        <DropdownMenuItem
          onClick={() => onMove(null)}
          data-testid={`${testidPrefix}-move-unfiled`}
          className={currentId === null ? "font-semibold" : ""}
        >
          <span className="w-2 h-2 rounded-full border border-slate-300 mr-2" />
          Unfiled
          {currentId === null && (
            <span className="ml-auto text-[10px] text-slate-400">current</span>
          )}
        </DropdownMenuItem>
        {collections.length > 0 && <DropdownMenuSeparator />}
        {collections.map((c) => (
          <DropdownMenuItem
            key={c.collection_id}
            onClick={() => onMove(c.collection_id)}
            data-testid={`${testidPrefix}-move-to-${c.collection_id}`}
            className={currentId === c.collection_id ? "font-semibold" : ""}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${colorDotClass(c.color)}`} />
            <span className="truncate">{c.name}</span>
            {currentId === c.collection_id && (
              <span className="ml-auto text-[10px] text-slate-400">current</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onManage}
          data-testid={`${testidPrefix}-open-manage`}
          className="text-slate-500"
        >
          Manage collections…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
