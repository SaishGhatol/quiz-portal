import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import AuthContext from './AuthContext';

const OrgContext = createContext(null);

export const OrgProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const [org,        setOrg]        = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  const refreshOrg = useCallback(async () => {
    if (!currentUser) { setOrg(null); return; }
    setOrgLoading(true);
    try {
      const res = await api.get('/org/me');
      setOrg(res.data.org || null);
    } catch {
      setOrg(null);
    } finally {
      setOrgLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { refreshOrg(); }, [refreshOrg]);

  return (
    <OrgContext.Provider value={{ org, orgLoading, refreshOrg }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider');
  return ctx;
};

export default OrgContext;
