// Recommended preview iframe heights per section type (px).
// Used by both the Editor's main preview and the Dashboard card thumbnails.
export const SECTION_PREVIEW_HEIGHT = {
  hero: 540,
  content: 280,
  products: 520,
  resources: 460,
  insights: 320,
  placeholder: 460,
  logos: 140,
  break: 320,
  tabs: 540,
};

export const DEFAULT_PREVIEW_HEIGHT = 480;

export function previewHeightFor(type) {
  return SECTION_PREVIEW_HEIGHT[type] || DEFAULT_PREVIEW_HEIGHT;
}
