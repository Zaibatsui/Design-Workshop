/**
 * Page templates — one-click starters that pre-populate a new page with a
 * coherent stack of blocks. Each template's blocks[] is an array of:
 *   { type: "section", section_type, config }   or
 *   { type: "richtext", config: { html, ... } }
 *
 * The backend normalizes these: it stamps a block_id on each, sanitizes any
 * richtext html, and persists them on the new page document.
 *
 * Configs are pulled from each section's own `defaults()` so templates stay
 * in sync whenever we tweak section defaults.
 */
import {
  Sparkles,
  Package,
  LayoutGrid,
  FileText,
} from "lucide-react";
import { SECTIONS_BY_ID } from "./registry";
import { richtext } from "./richtext";

const section = (id, overrides = {}) => ({
  type: "section",
  section_type: id,
  config: { ...SECTIONS_BY_ID[id].defaults(), ...overrides },
});

const rt = (html, overrides = {}) => ({
  type: "richtext",
  config: { ...richtext.defaults(), html, ...overrides },
});

export const PAGE_TEMPLATES = [
  {
    id: "blank",
    name: "Blank page",
    description: "Start empty — add blocks as you go.",
    icon: FileText,
    blocks: [],
  },
  {
    id: "landing",
    name: "Landing page",
    description: "Hero → value prop → logos → features → CTA. Marketing-ready.",
    icon: Sparkles,
    blocks: [
      section("hero"),
      rt(
        "<h2>Built for IT and telecom retailers</h2><p>Ship faster, convert better, scale without re-platforming. A pragmatic toolkit designed by operators who've actually run the store.</p>",
        { padY: 64, align: "center", maxWidth: 720 }
      ),
      section("logos"),
      section("insights"),
      rt(
        "<h2>Ready when you are</h2><p>Book a 20-minute walkthrough and see how Nettailer fits your stack.</p>",
        { padY: 48, align: "center", maxWidth: 640 }
      ),
      section("break"),
    ],
  },
  {
    id: "product-detail",
    name: "Product detail",
    description: "Hero showcase → related products → why-us → resources.",
    icon: Package,
    blocks: [
      section("hero"),
      rt(
        "<h2>Also worth a look</h2><p>Hand-picked alternatives and complements from our catalogue.</p>",
        { padY: 56, align: "left", maxWidth: 1100 }
      ),
      section("products"),
      section("insights"),
      section("resources"),
    ],
  },
  {
    id: "category-hub",
    name: "Category hub",
    description: "Banner → top products → subcategory tabs → brands → insights.",
    icon: LayoutGrid,
    blocks: [
      section("break"),
      rt(
        "<h2>This week's picks</h2><p>Fast movers across the category — updated live from the catalogue.</p>",
        { padY: 48, align: "left", maxWidth: 1100 }
      ),
      section("products"),
      section("tabs"),
      section("logos"),
      section("insights"),
    ],
  },
];

export const PAGE_TEMPLATES_BY_ID = Object.fromEntries(
  PAGE_TEMPLATES.map((t) => [t.id, t])
);
