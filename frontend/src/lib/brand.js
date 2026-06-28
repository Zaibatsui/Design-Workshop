// Centralized brand mark + name. Tweak in one place to retheme the app.
//
// `Icon` is a React component (not a Lucide icon) that renders the
// Design Workshop logo from `/dw-logo.png` — a square dark-bg + red
// monogram mark. It accepts a `className` so callers can size it
// the same way they used to size the Lucide icon. Because the image
// has its own dark background baked in, the wrapper boxes that used
// to fill themselves red (`bg-[#E01839]`) now just clip and centre
// the image — `iconBoxClass` carries `overflow-hidden` for that.

// React fragment is implicit here — only a single element is returned.
function BrandIcon({ className = "w-full h-full object-contain", ...rest }) {
  return (
    <img
      src="/dw-logo.png"
      alt="Design Workshop"
      draggable={false}
      className={className}
      {...rest}
    />
  );
}

export const BRAND = {
  name: "Design Workshop",
  shortName: "DW",
  Icon: BrandIcon,
  // No background fill any more — the image carries its own dark
  // canvas. `overflow-hidden` lets the parent's rounded corners clip
  // the image cleanly on every dashboard / editor chip.
  iconBoxClass: "bg-black overflow-hidden",
};
