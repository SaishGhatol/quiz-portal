import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { currentUser, loading } = useContext(AuthContext);
  const location = useLocation();
  
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;
