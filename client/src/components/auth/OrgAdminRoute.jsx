import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { Loader } from 'lucide-react';

/**
 * Protects org-admin pages (/org, /org/batches, /org/students, etc.)
 * - Not logged in → /login
 * - Logged in but not org_admin → /dashboard (with a message)
 */
const OrgAdminRoute = () => {
  const { currentUser, loading, isOrgAdmin } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="animate-spin h-6 w-6 text-indigo-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isOrgAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default OrgAdminRoute;
