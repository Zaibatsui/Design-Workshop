import { hero } from "./hero";
import { content } from "./content";
import { products } from "./products";
import { productGrid } from "./productGrid";
import { placeholder } from "./placeholder";
import { logos } from "./logos";
import { breakBanner } from "./break";
import { tabs } from "./tabs";
import { insights } from "./insights";
import { resources } from "./resources";
import { featureGrid } from "./featureGrid";
import { steps } from "./steps";
import { faq } from "./faq";
import { ctaBanner } from "./ctaBanner";
import { testimonials } from "./testimonials";
import { welcome } from "./welcome";
import { splitBanner } from "./splitBanner";
import { featuredCard } from "./featuredCard";
import { trustStrip } from "./trustStrip";

export const SECTIONS = [
  hero,
  splitBanner,
  featuredCard,
  welcome,
  content,
  products,
  productGrid,
  resources,
  insights,
  featureGrid,
  trustStrip,
  steps,
  testimonials,
  faq,
  ctaBanner,
  placeholder,
  logos,
  breakBanner,
  tabs,
];

export const SECTIONS_BY_ID = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s])
);
