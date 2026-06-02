import { LogIn, Wand2, ClipboardCopy } from "lucide-react";

const STEPS = [
  {
    Icon: LogIn,
    n: "01",
    title: "Sign in with Google",
    body: "One click to start. We only ask for your name and email — nothing else. Your library is ready immediately, no install or setup.",
  },
  {
    Icon: Wand2,
    n: "02",
    title: "Pick and customise",
    body: "Choose a section from the library — banner, product showcase, FAQ, whatever you need. Edit the words, swap the images, set your colours. Everything saves as you go.",
  },
  {
    Icon: ClipboardCopy,
    n: "03",
    title: "Copy and paste",
    body: "Hit copy. Paste the block into your shop, CMS, or page builder. It looks exactly the same wherever it lands — no plugins, no setup, no surprises.",
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
            From idea to published page in three steps.
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
