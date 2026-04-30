import { renderHero, DEFAULT_CONFIG } from "./heroRender";

export function makeUid() {
  return Math.random().toString(36).slice(2, 8);
}

export function makeDefaultConfig() {
  const c = DEFAULT_CONFIG();
  c.uid = makeUid();
  c.slides = [
    {
      id: makeUid(),
      title: "New Season Drop",
      subtitle:
        "Fresh fits, refined essentials. Discover the looks defining the season.",
      image:
        "https://images.unsplash.com/photo-1660807541304-9ec2f8ac2811?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBlLWNvbW1lcmNlJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3Nzc1NTU3OTl8MA&ixlib=rb-4.1.0&q=85",
      logo: "",
      ctaText: "Shop the Edit",
      ctaLink: "https://example.com/new-season",
    },
    {
      id: makeUid(),
      title: "Designed for Living",
      subtitle: "Minimalist furniture crafted for everyday calm.",
      image:
        "https://images.unsplash.com/photo-1617364852223-75f57e78dc96?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwZnVybml0dXJlJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc3NTU1Nzk5fDA&ixlib=rb-4.1.0&q=85",
      logo: "",
      ctaText: "Browse Collection",
      ctaLink: "https://example.com/furniture",
    },
    {
      id: makeUid(),
      title: "Smarter Tech, Sharper Design",
      subtitle: "Premium gadgets engineered around how you actually live.",
      image:
        "https://images.unsplash.com/photo-1594549181132-9045fed330ce?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNoJTIwZ2FkZ2V0JTIwcHJvZHVjdCUyMHNob3R8ZW58MHx8fHwxNzc3NTU1Nzk5fDA&ixlib=rb-4.1.0&q=85",
      logo: "",
      ctaText: "Discover Tech",
      ctaLink: "https://example.com/tech",
    },
  ];
  return c;
}

export { renderHero };
