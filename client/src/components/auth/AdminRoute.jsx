import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContext';
import { Loader } from 'lucide-react';

/**
 * Quiz-management routes under /admin (dashboard, quizzes, questions, statistics).
 * Allows: role === 'admin' OR role === 'org_admin'
 * Rationale: org admins need to create and manage quizzes for their organisation.
 * Platform-wide pages (users, analytics, reports, reviews) use PlatformAdminRoute instead.
 */
const AdminRoute = () => {
  const { currentUser, loading, isAdmin, isOrgAdmin } = useContext(AuthContext);
  const location = useLocation();

  const denied = !loading && currentUser && !isAdmin && !isOrgAdmin;

  useEffect(() => {
    if (denied) toast.error("You don't have access to that page.");
  }, [denied]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader className="animate-spin h-6 w-6 text-brand-500" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow platform admin OR org admin (they need quiz CRUD)
  if (denied) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
