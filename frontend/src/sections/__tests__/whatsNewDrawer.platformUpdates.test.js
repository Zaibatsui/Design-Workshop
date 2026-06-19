/**
 * Build-guard for `WhatsNewDrawer.jsx`.
 *
 * History: a stray manual edit to `PLATFORM_UPDATES` once dropped the
 * `{ id: "..." ` opening of an entry, leaving a dangling `name:` at
 * top level. Webpack then refused to compile and the whole frontend
 * went dark.
 *
 * This test exists to make sure that class of mistake fails CI rather
 * than the prod build. It:
 *   1. Parses `WhatsNewDrawer.jsx` with @babel/parser (jsx plugin).
 *      A syntax error here is a hard fail — same parser the dev
 *      server uses, so if this passes the build will too.
 *   2. Walks the AST to locate `export const PLATFORM_UPDATES = [...]`
 *      and asserts every array element is an ObjectExpression that
 *      carries an `id`, `name`, `addedOn`, `whatsNew`, and `kind`
 *      property — exactly the shape the drawer's render plumbing
 *      depends on.
 *   3. Asserts there are no duplicate `id` values (the seen-set logic
 *      keys off `id` so a dup would silently mask an entry).
 */
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const SRC_PATH = path.join(__dirname, "../../components/WhatsNewDrawer.jsx");
const source = fs.readFileSync(SRC_PATH, "utf8");

let pass = 0;
let fail = 0;
function expect(label, ok, detail = "") {
  if (ok) {
    console.log(`PASS · ${label}`);
    pass++;
  } else {
    console.error(`FAIL · ${label}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

// 1. Parse — this is the actual build-break guard.
let ast = null;
try {
  ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["jsx"],
  });
  expect("WhatsNewDrawer.jsx parses cleanly", true);
} catch (e) {
  expect(
    "WhatsNewDrawer.jsx parses cleanly",
    false,
    `${e.message} (line ${e.loc && e.loc.line})`,
  );
}

// 2. Locate `export const PLATFORM_UPDATES = [...]`.
let arrayNode = null;
if (ast) {
  for (const node of ast.program.body) {
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration &&
      node.declaration.type === "VariableDeclaration"
    ) {
      for (const decl of node.declaration.declarations) {
        if (
          decl.id &&
          decl.id.name === "PLATFORM_UPDATES" &&
          decl.init &&
          decl.init.type === "ArrayExpression"
        ) {
          arrayNode = decl.init;
        }
      }
    }
  }
}

expect("PLATFORM_UPDATES is an exported const array", !!arrayNode);

// 3. Every entry must be a plain object with the required keys.
const REQUIRED = ["id", "name", "addedOn", "whatsNew", "kind"];

function readKeys(objExpr) {
  const out = {};
  for (const prop of objExpr.properties) {
    if (prop.type !== "ObjectProperty" || prop.computed) continue;
    const k =
      prop.key.type === "Identifier"
        ? prop.key.name
        : prop.key.type === "StringLiteral"
        ? prop.key.value
        : null;
    if (!k) continue;
    // We only need to know the key is present + the value type for `id`.
    out[k] = prop.value;
  }
  return out;
}

const ids = [];
if (arrayNode) {
  arrayNode.elements.forEach((el, i) => {
    expect(
      `PLATFORM_UPDATES[${i}] is an object literal`,
      el && el.type === "ObjectExpression",
    );
    if (!el || el.type !== "ObjectExpression") return;
    const keys = readKeys(el);
    for (const k of REQUIRED) {
      expect(
        `PLATFORM_UPDATES[${i}] has '${k}'`,
        Object.prototype.hasOwnProperty.call(keys, k),
      );
    }
    if (keys.id) {
      const idVal =
        keys.id.type === "StringLiteral" ? keys.id.value : null;
      expect(
        `PLATFORM_UPDATES[${i}].id is a non-empty string literal`,
        typeof idVal === "string" && idVal.length > 0,
      );
      if (idVal) ids.push(idVal);
    }
  });
  expect(
    "PLATFORM_UPDATES has at least one entry",
    arrayNode.elements.length > 0,
  );
}

// 4. Unique ids.
const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
expect(
  "PLATFORM_UPDATES ids are unique",
  dupes.length === 0,
  dupes.length ? `duplicates: ${dupes.join(", ")}` : "",
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
