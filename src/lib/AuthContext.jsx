// AuthContext — bridges the JWT-based API auth with React state.
//
// On mount we ask the API "am I logged in?" by calling /auth/me. The
// backend reads the Bearer token from localStorage (handled in apiClient)
// and returns the user. The token is set on register / login and
// cleared on logout.

import { db } from "@/api/base44Client";
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalUser } from "@/lib/localAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Mirror the synchronous localStorage read into state so the UI can
  // render the right nav items immediately on first paint.
  useEffect(() => {
    const cached = getLocalUser();
    if (cached) {
      setUser(cached);
      setIsAuthenticated(true);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const me = await db.auth.me();
      if (me) {
        setUser(me);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: "auth_required", message: "Not authenticated" });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback((shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    db.auth.logout(shouldRedirect ? "/auth" : null);
  }, []);

  const navigateToLogin = useCallback(() => {
    db.auth.redirectToLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth: checkAuth,
        checkAppState: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
