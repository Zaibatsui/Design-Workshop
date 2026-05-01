/**
 * PageTemplatePicker — modal shown when the user clicks "New page".
 * Offers built-in templates (blank, landing, product-detail, category-hub,
 * about-us, pricing, blog-post) and the user's saved custom templates.
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, User } from "lucide-react";
import { PAGE_TEMPLATES } from "@/sections/pageTemplates";
import { api } from "@/lib/api";

export default function PageTemplatePicker({ onPick, onClose }) {
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customLoading, setCustomLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .listPageTemplates()
      .then((t) => {
        if (!cancelled) setCustomTemplates(t);
      })
      .catch(() => {})
      .finally(() => !cancelled && setCustomLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const deleteCustom = async (templateId) => {
    if (!window.confirm("Delete this template permanently?")) return;
    try {
      await api.deletePageTemplate(templateId);
      setCustomTemplates((t) => t.filter((x) => x.template_id !== templateId));
      toast.success("Template deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const pickCustom = (tpl) => {
    onPick({
      id: `custom-${tpl.template_id}`,
      name: tpl.name,
      blocks: tpl.blocks || [],
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 shadow-2xl"
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

        {(customLoading || customTemplates.length > 0) && (
          <>
            <div className="mt-8 mb-3 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Your templates
              </h3>
              <span className="text-xs text-slate-400">
                {customTemplates.length}
              </span>
            </div>
            {customLoading ? (
              <div className="text-xs text-slate-500">Loading…</div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                data-testid="custom-templates-grid"
              >
                {customTemplates.map((t) => (
                  <div
                    key={t.template_id}
                    className="group relative p-5 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
                    data-testid={`custom-template-${t.template_id}`}
                  >
                    <button
                      type="button"
                      onClick={() => pickCustom(t)}
                      className="absolute inset-0 rounded-lg"
                      aria-label={`Use template ${t.name}`}
                    />
                    <div className="relative pointer-events-none">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-[#E01839]" />
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {t.name}
                        </span>
                        <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400">
                          {(t.blocks || []).length} block
                          {(t.blocks || []).length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {t.description || "Your saved template."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteCustom(t.template_id);
                      }}
                      data-testid={`delete-custom-template-${t.template_id}`}
                      className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      title="Delete template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
