import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token,       setToken]       = useState(localStorage.getItem('token'));
  const [loading,     setLoading]     = useState(true);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const applyToken = (tkn) => {
    if (tkn) {
      localStorage.setItem('token', tkn);
      api.defaults.headers.common['Authorization'] = `Bearer ${tkn}`;
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
    setToken(tkn);
  };

  // Re-fetch the current user from the server — call this after org create/join
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setCurrentUser(res.data.user);
      return res.data.user;
    } catch {
      return null;
    }
  }, []);

  // ── Boot — load user from stored token ───────────────────────────────────────

  useEffect(() => {
    const boot = async () => {
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const res = await api.get('/auth/me');
          setCurrentUser(res.data.user);
        } catch {
          applyToken(null);
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    boot();
  }, []); // run once on mount only

  // ── Auth actions ─────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: tkn, user } = res.data;
    applyToken(tkn);
    setCurrentUser(user);
    return user;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: tkn, user } = res.data;
    applyToken(tkn);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    applyToken(null);
    setCurrentUser(null);
  };

  /**
   * Call this after an operation that changed the user's role/orgId on the server
   * (org creation, joining an org, etc.) and the server returned a new token.
   */
  const applyNewToken = (tkn, user) => {
    applyToken(tkn);
    if (user) setCurrentUser(user);
  };

  const updateProfile = async (userId, userData) => {
    const res = await api.put(`/users/${userId}`, userData);
    setCurrentUser(prev => ({ ...prev, ...res.data.user }));
    return res.data.user;
  };

  const changePassword = async (userId, passwordData) => {
    await api.put(`/users/${userId}/password`, passwordData);
    return true;
  };

  // ── Computed ─────────────────────────────────────────────────────────────────

  const isAdmin    = currentUser?.role === 'admin';
  const isOrgAdmin = currentUser?.role === 'org_admin' || currentUser?.role === 'admin';

  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
    refreshUser,
    applyNewToken,
    updateProfile,
    changePassword,
    isAdmin,
    isOrgAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
