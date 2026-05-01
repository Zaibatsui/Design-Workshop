import { heroFade } from "./hero-fade";
import { heroSlide } from "./hero-slide";
import { content } from "./content";
import { products } from "./products";
import { placeholder } from "./placeholder";
import { logos } from "./logos";
import { breakBanner } from "./break";
import { tabs } from "./tabs";
import { insights } from "./insights";
import { resources } from "./resources";
import { cta } from "./cta";

export const SECTIONS = [
  heroSlide,
  heroFade,
  content,
  products,
  resources,
  insights,
  placeholder,
  logos,
  breakBanner,
  tabs,
  cta,
];

export const SECTIONS_BY_ID = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s])
);
