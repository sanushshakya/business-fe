// src/components/PrivateRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

/**
 * Renders `children` for signed-in users and redirects to /login otherwise.
 */
const PrivateRoute = ({ children }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

export default PrivateRoute;
