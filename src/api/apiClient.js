// HTTP client for the Bo'sh Qaytma FastAPI backend.
// API base URL comes from VITE_API_URL or defaults to localhost:8000.
//
// The shape exposed here mimics the old `base44Client` so the rest of the
// frontend (`db.entities.Load.list()`, `db.auth.me()` etc.) keeps working
// without a mass refactor.

// In dev we hit `/api/*` and Vite proxies it to FastAPI. In prod / preview
// we hit the absolute URL from VITE_API_URL.
const isDev = import.meta.env.DEV;
const API_BASE = isDev
  ? "/api" // proxied by vite.config.js
  : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

// --- token storage ---------------------------------------------------
const TOKEN_KEY = "bq_token";
const USER_KEY = "bq_local_user";

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

// --- low-level fetch --------------------------------------------------

async function request(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const finalHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (auth) {
    const t = getToken();
    if (t) finalHeaders["Authorization"] = `Bearer ${t}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  // 204 No Content — return null
  if (res.status === 204) return null;

  // Try to parse JSON; fall back to text for non-JSON error bodies
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const detail = data?.detail || `HTTP ${res.status}`;
    const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// --- auth -------------------------------------------------------------

export const auth = {
  async register({ full_name, phone, password }) {
    const data = await request("/auth/register", {
      method: "POST",
      auth: false,
      body: { full_name, phone, password },
    });
    setToken(data.access_token);
    setStoredUser(data.user);
    return data.user;
  },

  async login({ phone, password }) {
    const data = await request("/auth/login", {
      method: "POST",
      auth: false,
      body: { phone, password },
    });
    setToken(data.access_token);
    setStoredUser(data.user);
    return data.user;
  },

  async me() {
    if (!getToken()) return null;
    try {
      const user = await request("/auth/me");
      setStoredUser(user);
      return user;
    } catch (err) {
      // Token rejected — clear local state
      if (err.status === 401 || err.status === 403) {
        setToken(null);
        setStoredUser(null);
      }
      return null;
    }
  },

  async logout(redirect) {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setToken(null);
    setStoredUser(null);
    if (redirect) window.location.href = redirect;
  },

  async redirectToLogin(returnTo) {
    const target = returnTo || window.location.href;
    window.location.href = `/auth?returnTo=${encodeURIComponent(target)}`;
  },

  // Synchronous — used by the AppLayout before the async check completes.
  isAuthenticated() {
    return !!getToken();
  },
};

// --- entity client ----------------------------------------------------
// Mirrors `db.entities.<Name>.list/filter/get/create/update/delete/subscribe`.
// "subscribe" is a polling stub — real-time requires WebSockets (out of scope).

function sortBy(items, orderBy) {
  if (!orderBy) return items;
  const isDesc = orderBy.startsWith("-");
  const field = isDesc ? orderBy.slice(1) : orderBy;
  return [...items].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (av < bv) return isDesc ? 1 : -1;
    if (av > bv) return isDesc ? -1 : 1;
    return 0;
  });
}

function makeEntityClient(entityName) {
  const lower = entityName.toLowerCase();
  // Map each entity to a REST prefix and the field used for the id.
  const cfg = {
    load: { list: "/loads", idField: "id" },
    driverprofile: { list: "/driver-profile", idField: "id" },
    loadapplication: { list: "/applications", idField: "id" },
    chatmessage: { list: "/chat", idField: "id", special: true },
    wallet: { list: "/wallet", idField: "id", special: true },
    adminnotification: { list: "/admin/notifications", idField: "id", special: true },
    appuser: { list: "/admin/users", idField: "id", special: true },
    deletedload: { list: "/admin/deleted-loads", idField: "id", special: true },
  }[lower] || { list: `/${lower}s`, idField: "id" };

  return {
    async list(orderBy = "-created_date", limit = 100) {
      const params = new URLSearchParams();
      if (orderBy) params.set("order_by", orderBy);
      if (limit) params.set("limit", String(limit));
      const data = await request(`${cfg.list}?${params}`);
      return Array.isArray(data) ? data : [];
    },

    async filter(query = {}, orderBy = "-created_date", limit = 100) {
      // Loads have a dedicated POST /loads/query endpoint.
      if (lower === "load") {
        const data = await request(`/loads/query`, {
          method: "POST",
          body: { ...query, ...(query.status ? {} : { status: query.status }) },
        });
        const sorted = sortBy(data, orderBy);
        return sorted.slice(0, limit);
      }
      // Generic path: GET with query params (only for simple equality filters)
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) params.set(k, String(v));
      if (orderBy) params.set("order_by", orderBy);
      if (limit) params.set("limit", String(limit));
      const data = await request(`${cfg.list}?${params}`);
      const arr = Array.isArray(data) ? data : [];
      return sortBy(arr, orderBy).slice(0, limit);
    },

    async get(id) {
      if (cfg.special) {
        // For entities without a public detail endpoint, fall back to filtering.
        const data = await request(`${cfg.list}?limit=200`);
        return (Array.isArray(data) ? data : []).find((r) => r[cfg.idField] === id) || null;
      }
      return await request(`${cfg.list}/${id}`);
    },

    async create(data) {
      return await request(`${cfg.list}`, { method: "POST", body: data });
    },

    async update(id, data) {
      // Wallet has dedicated endpoints
      if (lower === "wallet") {
        // No generic wallet update — operations are buy-credits / spend / premium
        throw new Error("Use wallet.buyCredits() / spend() / activatePremium() instead");
      }
      // Application uses /status subroute
      if (lower === "loadapplication" && data.status) {
        return await request(
          `${cfg.list}/${id}/status?new_status=${encodeURIComponent(data.status)}`,
          { method: "PATCH" }
        );
      }
      // Loads use PATCH
      if (lower === "load") {
        return await request(`${cfg.list}/${id}`, { method: "PATCH", body: data });
      }
      // Driver profile uses PATCH /me
      if (lower === "driverprofile") {
        return await request(`${cfg.list}/me`, { method: "PATCH", body: data });
      }
      // Admin user updates
      if (lower === "appuser") {
        const params = new URLSearchParams();
        if (data.is_active !== undefined) params.set("is_active", String(data.is_active));
        if (data.role !== undefined) params.set("role", data.role);
        return await request(`${cfg.list}/${id}?${params}`, { method: "PATCH" });
      }
      // Admin driver updates
      if (lower === "driverprofile") {
        return await request(`/admin/drivers/${id}`, { method: "PATCH", body: data });
      }
      // Fallback
      return await request(`${cfg.list}/${id}`, { method: "PATCH", body: data });
    },

    async delete(id) {
      return await request(`${cfg.list}/${id}`, { method: "DELETE" });
    },

    // Stub: real-time requires WebSockets. Provide a no-op unsubscribe.
    subscribe(_callback) {
      return () => {};
    },
  };
}

// --- wallet-specific helpers (used by WalletCard + PostLoadPage) -----
const walletEntity = makeEntityClient("Wallet");
export const wallet = {
  async me() {
    return await request("/wallet/me");
  },
  async buyCredits({ credits, label, demo_amount }) {
    return await request("/wallet/buy-credits", {
      method: "POST",
      body: { credits, label, demo_amount },
    });
  },
  async spend({ amount, action_type, label }) {
    return await request("/wallet/spend", {
      method: "POST",
      body: { amount, action_type, label },
    });
  },
  async activatePremium() {
    return await request("/wallet/activate-premium", { method: "POST", body: {} });
  },
  // Keep the entity-shaped proxy so the rest of the codebase still works.
  get entity() {
    return walletEntity;
  },
};

// --- chat helpers (used by ChatPage) ----------------------------------
const chatEntity = makeEntityClient("ChatMessage");
export const chat = {
  async list(loadId) {
    return await request(`/chat/load/${loadId}?order_by=created_date&limit=200`);
  },
  async send({ load_id, text, sender_role }) {
    return await request("/chat", {
      method: "POST",
      body: { load_id, text, sender_role },
    });
  },
  async markRead(id) {
    return await request(`/chat/${id}/read`, { method: "POST" });
  },
  get entity() {
    return chatEntity;
  },
};

// --- driver profile helpers ------------------------------------------
const driverEntity = makeEntityClient("DriverProfile");
export const driverProfile = {
  async me() {
    return await request("/driver-profile/me");
  },
  async upsert(data) {
    return await request("/driver-profile", { method: "POST", body: data });
  },
  async patch(data) {
    return await request("/driver-profile/me", { method: "PATCH", body: data });
  },
  get entity() {
    return driverEntity;
  },
};

// --- appuser helpers (admin + self) ----------------------------------
const userEntity = makeEntityClient("AppUser");
export const appUser = {
  async me() {
    return await auth.me();
  },
  async list(orderBy = "-created_date", limit = 200) {
    const params = new URLSearchParams();
    if (orderBy) params.set("order_by", orderBy);
    if (limit) params.set("limit", String(limit));
    return await request(`/admin/users?${params}`);
  },
  get entity() {
    return userEntity;
  },
};

// --- public db proxy -------------------------------------------------
// Kept for backwards-compat with the rest of the codebase that imports
// `db.auth.*` and `db.entities.<Name>.<method>`.

const entitiesProxy = new Proxy(
  {},
  {
    get: (_target, entityName) => {
      if (typeof entityName !== "string") return undefined;
      return makeEntityClient(entityName);
    },
  }
);

export const db = {
  auth,
  entities: entitiesProxy,
  wallet,
  chat,
  driverProfile,
  appUser,
  integrations: {
    Core: {
      UploadFile: async () => ({ file_url: "" }),
    },
  },
};

// Default export matches the old `base44Client.js` so existing imports keep working.
export default db;
export { API_BASE };
