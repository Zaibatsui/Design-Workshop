// Centralized brand mark + name. Tweak in one place to retheme the app.
//
// `Icon` renders the square DW monogram (`/dw-mark.png` — a circle-
// enclosed "DW" in red on a transparent background; the wordmark
// "DESIGN WORKSHOP" is dropped here so the mark stays crisp at the
// small sizes the app uses — 20px to 80px). Because the PNG is
// transparent the wrapper boxes can take ANY background colour (or
// none at all) and the mark sits cleanly on top.
//
// `Wordmark` renders a horizontal lock-up — monogram on the left,
// "Design Workshop" set in Outfit on the right — for places where
// the icon-only mark feels too cramped (email headers, splash screens,
// README hero). Accepts `className` for sizing, `dark` to flip the
// text colour to white over dark backgrounds.

function BrandIcon({ className = "w-full h-full object-contain", ...rest }) {
  return (
    <img
      src="/dw-mark.png"
      alt="Design Workshop"
      draggable={false}
      className={className}
      {...rest}
    />
  );
}

function BrandWordmark({ className = "", dark = false }) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
    >
      <img
        src="/dw-mark.png"
        alt=""
        draggable={false}
        aria-hidden="true"
        className="h-[1.4em] w-[1.4em] object-contain flex-shrink-0"
      />
      <span
        className={`font-semibold tracking-tight leading-none ${
          dark ? "text-white" : "text-slate-900"
        }`}
      >
        Design Workshop
      </span>
    </span>
  );
}

export const BRAND = {
  name: "Design Workshop",
  shortName: "DW",
  Icon: BrandIcon,
  Wordmark: BrandWordmark,
  // The mark is now transparent, so the wrapper has no background.
  // Just keep `overflow-hidden` so the parent's rounded corners clip
  // the image cleanly.
  iconBoxClass: "overflow-hidden",
};
