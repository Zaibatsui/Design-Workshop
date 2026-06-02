import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QA = [
  {
    q: "Is this a website builder like Wix or Squarespace?",
    a: "No — Design Workshop isn't a website builder. It builds polished content blocks (banners, product showcases, FAQs, landing-page sections) that you paste into the website tools you already use. Keep your shop, keep your CMS, just upgrade the content you put in them.",
  },
  {
    q: "Which platforms does Design Workshop work with?",
    a: "Anywhere that accepts a custom HTML block or embed. That includes Shopify, WordPress (Gutenberg, Classic Editor, Elementor, Divi, and most page builders), Squarespace, Wix, Webflow, BigCommerce, Magento / Adobe Commerce, PrestaShop, OpenCart, Drupal, Joomla, HubSpot CMS, Umbraco, Sitecore, and Nettailer. If you can paste HTML into a page, you can use Design Workshop.",
  },
  {
    q: "Do I need to know how to code?",
    a: "Not at all. The editor is fully visual — you click into a section, change the words, swap the images, set your colours, and a live preview shows you exactly how it'll look. The HTML is generated for you behind the scenes; you only ever see it when you hit \"Copy\".",
  },
  {
    q: "Do I need to install anything?",
    a: "Nothing. You sign in, build, and copy the result. The HTML you paste into your site is completely self-contained — no plugins, no extensions, no extra scripts to load. It just works.",
  },
  {
    q: "Will the sections slow down my website?",
    a: "No. Each section is small (around 4–8 KB) and doesn't load any external libraries or third-party scripts. It renders fast on mobile and desktop, and won't hurt your page speed scores.",
  },
  {
    q: "Is the content I create actually mine?",
    a: "Completely. You own every line of the HTML. There are no licence headers, no watermarks, no tracking, no calls back to our servers. Walk away with your sections and they keep working forever, even if Design Workshop disappears tomorrow.",
  },
  {
    q: "Can I use multiple sections on the same page?",
    a: "Yes. Each section is styled independently so they never clash with each other — or with the rest of your site. Stack as many as you like. You can also build a whole page in our editor and copy the lot as one combined block.",
  },
  {
    q: "Is there a free tier?",
    a: "Design Workshop is free while we're in open beta. We may introduce paid add-ons later (a marketplace of premium sections, team collaboration) but the core editor will stay free.",
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
