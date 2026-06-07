/**
 * Studio Templates — full-page browser for page templates.
 *
 * Mirrors the data + behaviour of the existing <PageTemplatePicker /> modal
 * but renders as a dedicated page inside the Studio shell. Lists every
 * built-in template (with NEW / UPDATED badges) followed by the user's
 * saved custom templates. Picking either kicks off a new page via the
 * same `/edit/page/new` route Classic mode uses, so the downstream
 * editor behaviour is unchanged.
 *
 * Classic mode keeps the original modal flow inside Dashboard — only
 * Studio gets this dedicated surface (registered via `StudioOrClassic`
 * with a redirect-to-Dashboard fallback for Classic users).
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileText, Trash2, User } from "lucide-react";
import StudioShell from "@/components/studio/StudioShell";
import { PAGE_TEMPLATES } from "@/sections/pageTemplates";
import { computeBadges } from "@/lib/sectionBadges";
import { SectionBadge } from "@/pages/dashboard/common";
import { api } from "@/lib/api";

export default function StudioTemplates() {
  const navigate = useNavigate();
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customLoading, setCustomLoading] = useState(true);
  const badges = useMemo(() => computeBadges(PAGE_TEMPLATES), []);

  useEffect(() => {
    let cancelled = false;
    api
      .listPageTemplates()
      .then((t) => {
        if (!cancelled) setCustomTemplates(t);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCustomLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickBuiltIn = (template) => {
    // Strip non-serializable fields (Lucide icon component) before
    // shoving through router state — matches Dashboard.createPage().
    const safe = template
      ? {
          id: template.id,
          name: template.name,
          blocks: template.blocks || [],
        }
      : null;
    navigate("/edit/page/new", { state: { template: safe } });
  };

  const pickCustom = (tpl) => {
    navigate("/edit/page/new", {
      state: {
        template: {
          id: `custom-${tpl.template_id}`,
          name: tpl.name,
          blocks: tpl.blocks || [],
        },
      },
    });
  };

  const deleteCustom = async (templateId) => {
    if (!window.confirm("Delete this template permanently?")) return;
    try {
      await api.deletePageTemplate(templateId);
      setCustomTemplates((t) =>
        t.filter((x) => x.template_id !== templateId)
      );
      toast.success("Template deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <StudioShell active="templates">
      <div className="max-w-6xl mx-auto px-6 py-8" data-testid="studio-templates">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pick a built-in template to pre-fill a page with a coherent block
            stack, or start from one of your saved custom templates.
          </p>
        </div>

        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Built-in
            </h2>
            <span className="text-xs text-slate-400">
              {PAGE_TEMPLATES.length}
            </span>
          </div>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            data-testid="builtin-templates-grid"
          >
            {PAGE_TEMPLATES.map((t) => {
              const Icon = t.icon;
              const badge = badges[t.id];
              return (
                <button
                  key={t.id}
                  data-testid={`studio-template-${t.id}`}
                  onClick={() => pickBuiltIn(t)}
                  className="relative text-left p-5 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
                >
                  <SectionBadge
                    kind={badge}
                    testid={`studio-template-badge-${t.id}`}
                  />
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-[#E01839]" />
                    <span className="text-sm font-medium text-slate-900">
                      {t.name}
                    </span>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-400">
                      {t.blocks.length} block
                      {t.blocks.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your templates
            </h2>
            <span className="text-xs text-slate-400">
              {customTemplates.length}
            </span>
          </div>
          {customLoading ? (
            <div className="text-xs text-slate-500">Loading…</div>
          ) : customTemplates.length === 0 ? (
            <div
              className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500"
              data-testid="studio-templates-empty"
            >
              You haven&apos;t saved any templates yet. Save a page as a template
              from the page editor to see it here.
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              data-testid="studio-custom-templates-grid"
            >
              {customTemplates.map((t) => (
                <div
                  key={t.template_id}
                  className="group relative p-5 rounded-lg border border-slate-200 hover:border-[#E01839] hover:bg-[#E01839]/[0.03] transition-colors"
                  data-testid={`studio-custom-template-${t.template_id}`}
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
                    data-testid={`studio-delete-custom-template-${t.template_id}`}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </StudioShell>
  );
}
