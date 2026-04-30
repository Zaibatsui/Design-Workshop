import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Strip the Emergent platform "Made with Emergent" badge whenever it's
// injected — emergent-main.js re-adds the element with inline `!important`
// styles that beat CSS, so we remove the node itself.
const removeEmergentBadge = () => {
  document.querySelectorAll("#emergent-badge").forEach((el) => el.remove());
};
removeEmergentBadge();
new MutationObserver(removeEmergentBadge).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
