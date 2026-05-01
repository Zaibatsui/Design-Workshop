import { hero } from "./hero";
import { content } from "./content";
import { products } from "./products";
import { placeholder } from "./placeholder";
import { logos } from "./logos";
import { breakBanner } from "./break";
import { tabs } from "./tabs";
import { insights } from "./insights";
import { resources } from "./resources";

export const SECTIONS = [
  hero,
  content,
  products,
  resources,
  insights,
  placeholder,
  logos,
  breakBanner,
  tabs,
];

export const SECTIONS_BY_ID = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s])
);
