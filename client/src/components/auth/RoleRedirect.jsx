import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../../contexts/AuthContext';
import { roleHome, isStudentRole } from '../../utils/roles';

// "/" — guests get the marketing page, signed-in users go straight to their workspace
export const LandingRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  return currentUser ? <Navigate to={roleHome(currentUser)} replace /> : children;
};

// Student-only pages (the practice dashboard) send admins to their own home instead
export const StudentOnlyRoute = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  return currentUser && !isStudentRole(currentUser) ? <Navigate to={roleHome(currentUser)} replace /> : children;
};
