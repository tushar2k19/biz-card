import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects routes that require login.
 * If adminOnly is true, only SUPER_ADMIN can access; others redirect to /.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
}
