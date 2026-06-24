// src/components/PrivateRoute.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * PrivateRoute component - A Higher-Order Component (HOC) to check authentication before rendering the wrapped component.
 * @param {Object} props - The properties passed to this component.
 * @param {React.ReactNode} props.children - The child component to render if authenticated.
 * @returns {React.ReactNode} - The wrapped component or redirect to /login if not authenticated.
 */
const PrivateRoute = ({ children }) => {
  const navigate = useNavigate();

  // Check if the user is authenticated
  const isAuthenticated = authService.isAuthenticated();

  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  // Render the wrapped component if authenticated
  return children;
};

export default PrivateRoute;