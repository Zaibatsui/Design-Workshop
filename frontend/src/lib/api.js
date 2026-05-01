// Thin fetch wrapper for the FastAPI backend. Always sends cookies.
const API = process.env.REACT_APP_BACKEND_URL;

async function req(path, opts = {}) {
  const r = await fetch(`${API}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
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

  listPages: () => req("/pages"),
  createPage: (data) =>
    req("/pages", { method: "POST", body: JSON.stringify(data) }),
  getPage: (id) => req(`/pages/${id}`),
  updatePage: (id, patch) =>
    req(`/pages/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deletePage: (id) => req(`/pages/${id}`, { method: "DELETE" }),
};
