import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const userDataStr = localStorage.getItem('currentUser');
  
  if (!userDataStr) {
    // Not logged in
    return <Navigate to="/login" />;
  }
  
  const userData = JSON.parse(userDataStr);
  
  if (allowedRole && userData.role !== allowedRole) {
    // Wrong role, redirect to appropriate dashboard
    switch (userData.role) {
      case 'admin':
        return <Navigate to="/admin-dashboard" />;
      case 'lecturer':
        return <Navigate to="/lecturer-dashboard" />;
      case 'classrep':
        return <Navigate to="/class-rep-dashboard" />; // Note: matches your route path
      default:
        return <Navigate to="/login" />;
    }
  }
  
  // All checks passed, allow access
  return children;
};

export default ProtectedRoute;