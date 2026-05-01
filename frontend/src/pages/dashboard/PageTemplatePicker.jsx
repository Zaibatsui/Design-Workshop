/**
 * PageTemplatePicker — modal shown when the user clicks "New page".
 * Offers a blank start or one of the predefined templates.
 */
import { PAGE_TEMPLATES } from "@/sections/pageTemplates";

export default function PageTemplatePicker({ onPick, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="page-template-picker"
      >
        <h2 className="font-heading text-xl font-semibold tracking-tight mb-1">
          Start a new page
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Pick a template to pre-fill the page with a coherent block stack, or
          start blank and compose your own.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAGE_TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                data-testid={`template-${t.id}`}
                onClick={() => onPick(t)}
                className="text-left p-5 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-[#E01839]" />
                  <span className="text-sm font-medium text-slate-900">
                    {t.name}
                  </span>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400">
                    {t.blocks.length} block{t.blocks.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
