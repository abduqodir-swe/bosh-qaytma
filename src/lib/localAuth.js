// Local auth helper — wraps the real auth API client.
//
// In the old localStorage-mock era this file did password hashing, JWT
// issuing, and localStorage persistence. Now the backend handles all of
// that; we just call the HTTP endpoints and mirror the response into
// localStorage so other parts of the app can read `getLocalUser()`
// synchronously (used by AppLayout to gate the admin nav item).

import { db } from "@/api/base44Client";

const USER_KEY = "bq_local_user";
const TOKEN_KEY = "bq_token";

// Synchronous reads — used by AppLayout before the async check completes.
export function getLocalUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

export function clearLocalUser() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function registerUser({ full_name, phone, password }) {
  try {
    const user = await db.auth.register({ full_name, phone, password });
    return user;
  } catch (e) {
    if (e.status === 409) throw new Error("PHONE_EXISTS");
    throw e;
  }
}

export async function loginUser({ phone, password }) {
  return await db.auth.login({ phone, password });
}

export async function checkPhoneExists(phone) {
  // The backend doesn't expose a "does this phone exist?" endpoint for
  // privacy. We try to login with a dummy password and inspect the error.
  // 401 = "phone exists but password is wrong" → true; 404/422 = "doesn't exist".
  try {
    await db.auth.login({ phone, password: "__probe_no_password__" });
    return true; // extremely unlikely — login would only succeed with the real pwd
  } catch (e) {
    if (e.status === 401) return true;       // phone known, bad pwd
    if (e.status === 403) return true;       // phone known, user blocked
    return false;                            // 422 or 500 = unknown phone
  }
}

// Phone helpers — purely client-side validation/formatting.
export function normalizePhone(raw) {
  if (!raw) return "";
  // Strip everything except digits, plus a single leading '+'.
  let s = String(raw).trim().replace(/[^\d+]/g, "");
  if (s.startsWith("+")) return s;
  if (s.length === 0) return "";
  // If user typed a local 9-digit number, assume Uzbekistan (+998).
  if (/^\d{9}$/.test(s)) return "+998" + s;
  return "+" + s;
}

export function validatePhone(raw) {
  const s = normalizePhone(raw);
  if (!s) return "Telefon raqamini kiriting";
  if (!/^\+\d{9,15}$/.test(s)) return "Telefon raqam noto'g'ri formatda";
  return null;
}

// Backwards-compat: an old file referenced `simpleHash`. We don't hash
// passwords client-side anymore (the server does it with bcrypt), but
// keep a stub so legacy imports don't crash.
export function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h = h & h;
  }
  return Math.abs(h).toString(36);
}
