import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QA = [
  {
    q: "Do I need to install anything to use the snippets?",
    a: "No. Each snippet is a single block of HTML, scoped CSS, and a tiny inline IIFE. Paste it into a CMS rich-text field, an HTML widget, or a static page — no npm, no build step, no CDN dependencies.",
  },
  {
    q: "Is the code I generate actually mine?",
    a: "Yes. You own every byte. The generated HTML/CSS/JS has no licence headers, no fingerprints, no calls home. We never inject tracking. Walk away with your snippets and they keep working forever.",
  },
  {
    q: "Will the snippets slow down my site?",
    a: "Tiny by design — most sections are 4–8 KB gzipped, with no third-party requests. The only JS we ship is the few hundred bytes needed for things like the carousel logic. Lighthouse-friendly out of the box.",
  },
  {
    q: "Do I need to know HTML to use Design Workshop?",
    a: "No — the editor is fully WYSIWYG. If you can use Notion or Google Docs, you can use this. The HTML is what we generate behind the scenes for your developer / CMS to embed.",
  },
  {
    q: "Can multiple sections coexist on the same page?",
    a: "Yes. Every section is CSS-scoped to a unique class so paste-and-stack just works. The Hybrid Page Builder also lets you compose multiple sections into a single combined snippet.",
  },
  {
    q: "Is there a free tier?",
    a: "Design Workshop is free during the open beta. We'll introduce paid tiers later for advanced features (component marketplace, multiplayer collab) but the core editor will stay free.",
  },
];

export default function FAQ() {
  return (
    <section
      data-testid="login-faq"
      className="py-24 md:py-32 border-t border-slate-200"
    >
      <div className="max-w-3xl mx-auto px-6 md:px-8">
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-[#E01839] mb-4">
            FAQ
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
            Questions, answered.
          </h2>
        </div>
        <Accordion type="single" collapsible className="border-t border-slate-200">
          {QA.map((item, i) => (
            <AccordionItem
              key={item.q}
              value={`faq-${i}`}
              data-testid={`faq-item-${i}`}
              className="border-b border-slate-200"
            >
              <AccordionTrigger className="text-left text-base font-heading font-semibold tracking-tight text-slate-900 hover:no-underline py-5">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-slate-600 pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
