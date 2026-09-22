import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: ('CUSTOMER' | 'AGENT')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If authenticated but wrong role, redirect to their respective dashboard
    const redirectPath = user.role === 'CUSTOMER' ? '/dashboard' : '/agent-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated and authorized, render child routes
  return <Outlet />;
};

export default ProtectedRoute;
