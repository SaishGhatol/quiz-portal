import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { Loader } from 'lucide-react';

/**
 * Platform admin routes (/admin/*).
 * Allows: role === 'admin' OR role === 'org_admin'
 * Rationale: org admins need to create and manage quizzes for their organisation.
 */
const AdminRoute = () => {
  const { currentUser, loading, isAdmin, isOrgAdmin } = useContext(AuthContext);
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

  // Allow platform admin OR org admin (they need quiz CRUD)
  if (!isAdmin && !isOrgAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
