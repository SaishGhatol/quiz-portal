import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import { roleHome } from '../../utils/roles';
import { Loader } from 'lucide-react';

/**
 * Platform-admin-only routes (/admin/users, /admin/analytics, /admin/reports, /admin/reviews).
 * Allows: role === 'admin' only. Everyone else is sent to their own workspace — the APIs behind these pages are
 * platform-admin only, so letting anyone else in would just show error states.
 */
const PlatformAdminRoute = () => {
  const { currentUser, loading, isAdmin } = useContext(AuthContext);
  const location = useLocation();

  const denied = !loading && currentUser && !isAdmin;

  useEffect(() => {
    if (denied) toast.error('That page is only available to platform admins.');
  }, [denied]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="animate-spin h-6 w-6 text-brand-500" aria-label="Loading" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (denied) {
    return <Navigate to={roleHome(currentUser)} replace />;
  }

  return <Outlet />;
};

export default PlatformAdminRoute;
