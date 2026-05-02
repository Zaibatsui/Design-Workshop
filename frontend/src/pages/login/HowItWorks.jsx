import { LogIn, Wand2, ClipboardCopy } from "lucide-react";

const STEPS = [
  {
    Icon: LogIn,
    n: "01",
    title: "Sign in with Google",
    body: "One click, one scope (name + email). Your library spins up instantly — no install, no setup.",
  },
  {
    Icon: Wand2,
    n: "02",
    title: "Build & autosave",
    body: "Compose sections in the WYSIWYG editor. Stack them into pages. Drag to reorder. Everything autosaves the moment you click away.",
  },
  {
    Icon: ClipboardCopy,
    n: "03",
    title: "Copy → paste → ship",
    body: "Each section and page exposes a single HTML/CSS/JS snippet. Copy it, paste into your CMS, done. No build step, no dependencies.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-testid="login-how-it-works"
      className="py-24 md:py-32"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            How it works
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            Three steps from blank canvas to live e-commerce content.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-md overflow-hidden">
          {STEPS.map(({ Icon, n, title, body }, i) => (
            <div
              key={n}
              data-testid={`step-${i}`}
              className="bg-white p-8 md:p-10 flex flex-col gap-5"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-3xl font-semibold tracking-tighter text-[#E01839] leading-none">
                  {n}
                </span>
                <Icon className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold tracking-tight text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 flex-1">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
