/**
 * Regression: when a tab row is opened in the editor, the preview
 * iframe must switch to that tab. Wired via the existing
 * `ns-focus-item` postMessage channel — the IIFE listens for
 * `{ type: "ns-focus-item", list: "tab", index: N }` and activates
 * the Nth tab. Without this the preview was permanently stuck on
 * tab 1, no matter which row the user was editing.
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "../tabs.js"), "utf8");

let pass = 0;
let fail = 0;
function expect(label, ok) {
  if (ok) { console.log("PASS ·", label); pass++; }
  else { console.error("FAIL ·", label); fail++; }
}

// 1. The IIFE factors activation into a helper so both the click
//    handler and the message listener use the same code path.
expect(
  "IIFE defines an `activate(i)` helper that toggles both buttons + panels",
  /function activate\(i\)\{[\s\S]{0,500}btns\.forEach\([\s\S]{0,200}\.toggle\("is-active",j===i\)[\s\S]{0,300}panels\.forEach\([\s\S]{0,200}\.toggle\("is-active",p\.getAttribute\("data-ns-panel"\)===id\)/.test(src),
);

// 2. Initial activation still picks tab 0 on boot.
expect(
  "Boots with tab 0 active",
  /activate\(0\)/.test(src),
);

// 3. Click handlers route through `activate` rather than duplicating
//    the toggle logic.
expect(
  "Click handlers call `activate(i)` with the row's own index",
  /btns\.forEach\(function\(btn,i\)\{btn\.addEventListener\("click",function\(\)\{activate\(i\);\}\);\}\);/.test(src),
);

// 4. Postmessage listener flips to the editor-focused tab.
expect(
  "Listens for postMessage `ns-focus-item` with list:'tab'",
  /window\.addEventListener\("message"[\s\S]{0,400}d\.type==="ns-focus-item"[\s\S]{0,100}d\.list==="tab"[\s\S]{0,80}activate\(d\.index\)/.test(src),
);

// 5. The Form panel's ListEditor uses testidPrefix="tab" — which is
//    the key that ListEditor broadcasts on its `ns-editor-focus-item`
//    event. PreviewFrame forwards that into the iframe verbatim,
//    so the IIFE's listener and the FormPanel ListEditor MUST stay
//    aligned on the literal string "tab".
expect(
  "Form panel ListEditor testidPrefix matches the IIFE's expected list ('tab')",
  /testidPrefix="tab"/.test(src),
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
