// Single source of truth for the current user, backed by localStorage.
// Synchronous via useSyncExternalStore → no mount-time flicker, no double state.

import { useSyncExternalStore } from "react";
// localAuth.js no longer exports SESSION_KEY — the keys are now defined
// inside that module. Hard-code the same constant here to keep the hook
// self-contained.
const _K = "bq_local_user";

// Stable subscribe: re-render only when the actual user object changes (or sign-in/out).
function subscribe(callback) {
  const onStorage = (e) => {
    if (e.key === _K || e.key === null) callback();
  };
  window.addEventListener("storage", onStorage);
  // Custom event lets the same tab notify when AuthPage/ProfilePage mutate the session.
  window.addEventListener("bq:user-changed", callback);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("bq:user-changed", callback);
  };
}

// Cached snapshot. useSyncExternalStore re-runs getSnapshot on every render and
// Object.is-compares the result — a fresh object from localStorage each time
// would loop forever. We keep the last value + its JSON fingerprint.
let _cachedUser = null;
let _cachedJson = null;
function getSnapshot() {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(_K) : null;
  if (raw === _cachedJson) return _cachedUser;
  _cachedJson = raw;
  _cachedUser = raw ? JSON.parse(raw) : null;
  return _cachedUser;
}

// SSR-safe: returns null when window is undefined.
function getServerSnapshot() {
  return null;
}

export function useCurrentUser() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsAdmin() {
  const u = useCurrentUser();
  return u?.role === "admin";
}

// Mutate session and notify subscribers in the same tab.
export function notifyUserChanged() {
  window.dispatchEvent(new Event("bq:user-changed"));
}
