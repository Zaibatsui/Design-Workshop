// Thin fetch wrapper for the FastAPI backend. Always sends cookies.
//
// Backend URL is normally baked at build time from REACT_APP_BACKEND_URL.
// Fall back to the page's own origin at runtime when that arg was missing
// during `docker compose build` — same-origin requests always work
// regardless of how the bundle was built. Empty string also works (axios
// resolves relative URLs against the page origin) but having an explicit
// absolute URL surfaces config drift in DevTools where it's discoverable.
const buildTimeBackendUrl = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
const API =
  buildTimeBackendUrl ||
  (typeof window !== "undefined" ? window.location.origin : "");

// Bound every fetch with an AbortController so a stuck connection (e.g. a
// stale dev-server HMR socket or a dropped backend) surfaces as a toastable
// error instead of a hanging click handler that looks like "nothing happened".
const REQUEST_TIMEOUT_MS = 20000;

async function req(path, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let r;
  try {
    r = await fetch(`${API}/api${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      signal: ctrl.signal,
      ...opts,
    });
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error("Request timed out. Try hard-refreshing (Ctrl/Cmd+Shift+R).");
      err.status = 0;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
  if (r.status === 401) {
    const err = new Error("unauthorized");
    err.status = 401;
    throw err;
  }
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err = new Error(text || `HTTP ${r.status}`);
    err.status = r.status;
    throw err;
  }
  if (r.status === 204) return null;
  const ct = r.headers.get("content-type") || "";
  return ct.includes("application/json") ? r.json() : r.text();
}

export const api = {
  listSections: () => req("/sections"),
  createSection: (data) =>
    req("/sections", { method: "POST", body: JSON.stringify(data) }),
  getSection: (id) => req(`/sections/${id}`),
  updateSection: (id, patch) =>
    req(`/sections/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteSection: (id) => req(`/sections/${id}`, { method: "DELETE" }),
  duplicateSection: (id) =>
    req(`/sections/${id}/duplicate`, { method: "POST" }),
  reorderSections: (ids) =>
    req("/sections/reorder/bulk", {
      method: "PUT",
      body: JSON.stringify({ section_ids: ids }),
    }),

  listPages: () => req("/pages"),
  createPage: (data) =>
    req("/pages", { method: "POST", body: JSON.stringify(data) }),
  getPage: (id) => req(`/pages/${id}`),
  updatePage: (id, patch) =>
    req(`/pages/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deletePage: (id) => req(`/pages/${id}`, { method: "DELETE" }),
  duplicatePage: (id) => req(`/pages/${id}/duplicate`, { method: "POST" }),
  reorderPages: (ids) =>
    req("/pages/reorder/bulk", {
      method: "PUT",
      body: JSON.stringify({ page_ids: ids }),
    }),

  listPageTemplates: () => req("/page-templates"),
  createPageTemplate: (data) =>
    req("/page-templates", { method: "POST", body: JSON.stringify(data) }),
  deletePageTemplate: (id) =>
    req(`/page-templates/${id}`, { method: "DELETE" }),

  getBrandKit: () => req("/brand-kit"),
  updateBrandKit: (kit) =>
    req("/brand-kit", { method: "PUT", body: JSON.stringify(kit) }),

  // Landing-demo picker (admin-only writes; the public read is hit
  // unauthenticated from the marketing landing page).
  getLandingDemo: () => req("/admin/landing-demo"),
  setLandingDemo: (pageId) =>
    req("/admin/landing-demo", {
      method: "PUT",
      body: JSON.stringify({ page_id: pageId }),
    }),
};
