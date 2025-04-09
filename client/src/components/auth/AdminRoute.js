import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';

const AdminRoute = () => {
  const { currentUser, loading, isAdmin } = useContext(AuthContext);
  
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
};

export default AdminRoute;