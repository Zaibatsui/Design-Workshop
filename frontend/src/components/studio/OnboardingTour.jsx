/**
 * OnboardingTour — one-time 4-step intro for new Studio users.
 *
 * Renders a centred modal overlay the first time a freshly-signed-in
 * user lands in Studio (when `user.onboarded === false`). Walks them
 * through the four primary surfaces: section library, brand kit,
 * templates, and the click-to-edit affordance. Finishing OR skipping
 * calls `markOnboarded()` so the tour never fires again.
 *
 * Renders nothing when:
 *   • auth is still loading, or
 *   • there's no signed-in user, or
 *   • the user has already been onboarded.
 *
 * Lives at the StudioShell level so it shows up on every Studio
 * route (most likely the Dashboard, since that's where new users
 * land first).
 */
import { useCallback, useState } from "react";
import {
  LayoutGrid,
  Palette,
  FileStack,
  MousePointerClick,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    id: "library",
    Icon: LayoutGrid,
    eyebrow: "Step 1 of 4",
    title: "Your section library",
    body:
      "Browse 23+ ready-to-use e-commerce sections — hero carousels, product grids, FAQs, testimonials and more. Click any thumbnail to start editing.",
  },
  {
    id: "brand-kit",
    Icon: Palette,
    eyebrow: "Step 2 of 4",
    title: "Brand kit (set it once)",
    body:
      "Define your colors, fonts and logos in one place. Every section you create inherits them automatically — no copy-paste, no drift.",
  },
  {
    id: "templates",
    Icon: FileStack,
    eyebrow: "Step 3 of 4",
    title: "Page templates",
    body:
      "Need a full page, not just one section? Pick a template to pre-fill a coherent block stack you can tweak from there.",
  },
  {
    id: "click-to-edit",
    Icon: MousePointerClick,
    eyebrow: "Step 4 of 4",
    title: "Click anything to edit it",
    body:
      "Inside the editor, click any heading, card or button in the live preview — the right pane jumps straight to its settings. Carousels even snap to the card you clicked.",
  },
];

export default function OnboardingTour() {
  const { user, markOnboarded } = useAuth();
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const dismiss = useCallback(async () => {
    setClosing(true);
    await markOnboarded();
  }, [markOnboarded]);

  // Bail out early if there's no user yet, the user has already
  // dismissed the tour, or we're mid-dismiss animation.
  if (!user || user.onboarded || closing) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      data-testid="onboarding-tour"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <button
          type="button"
          onClick={dismiss}
          data-testid="onboarding-skip"
          className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors z-10"
          title="Skip tour"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="pt-12 pb-6 px-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
              <Sparkles className="w-3 h-3" strokeWidth={2} />
              {s.eyebrow}
            </span>
          </div>
          <div className="flex items-center justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <s.Icon className="w-7 h-7 text-blue-700" strokeWidth={1.5} />
            </div>
          </div>
          <h2
            id="onboarding-title"
            className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 text-center mb-2"
          >
            {s.title}
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed text-center">
            {s.body}
          </p>
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5" data-testid="onboarding-dots">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-blue-600"
                    : i < step
                    ? "w-1.5 bg-blue-300"
                    : "w-1.5 bg-zinc-300"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={dismiss}
              data-testid="onboarding-skip-text"
              className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 px-2 py-1"
            >
              Skip
            </button>
            {isLast ? (
              <Button
                onClick={dismiss}
                data-testid="onboarding-finish"
                className="h-8 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-medium gap-1.5"
              >
                Let&apos;s go
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                onClick={() => setStep((s) => s + 1)}
                data-testid="onboarding-next"
                className="h-8 px-4 bg-zinc-900 hover:bg-zinc-800 text-white text-[12px] font-medium gap-1.5"
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
