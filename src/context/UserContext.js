import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('admin'); // Default role
  const [user, setUser] = useState(null);

  // Detect user role based on URL path
  useEffect(() => {
    const detectRoleFromPath = () => {
      const path = window.location.pathname;
      
      if (path.includes('lecturer-dashboard')) {
        setUserRole('lecturer');
      } else if (path.includes('class-rep-dashboard')) {
        setUserRole('classRep');
      } else if (path.includes('admin-dashboard')) {
        setUserRole('admin');
      }
    };

    detectRoleFromPath();
    
    // Listen for route changes
    const handleRouteChange = () => {
      detectRoleFromPath();
    };

    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const value = {
    user,
    userRole,
    setUserRole
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};