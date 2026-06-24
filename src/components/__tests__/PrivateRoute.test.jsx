import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'zustand';
import create from 'zustand';

// Mock the authService
jest.mock('../services/authService');

const mockAuthService = {
  isAuthenticated: jest.fn(),
};

const useAuthStoreMock = create((set) => ({
  ...mockAuthService,
}));

// PrivateRoute component
export const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(use => use.isAuthenticated);

  if (!isAuthenticated) {
    return <div to="/login">Redirecting to /login...</div>;
  }

  return <>{children}</>;
};

// Test the PrivateRoute component
describe('PrivateRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    useAuthStoreMock.getState().isAuthenticated.mockReturnValue(false);
    render(
      <Provider createStore={useAuthStoreMock}>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </Provider>
    );

    expect(screen.getByText('Redirecting to /login...')).toBeInTheDocument();
  });

  it('displays protected content for authenticated users', () => {
    useAuthStoreMock.getState().isAuthenticated.mockReturnValue(true);
    render(
      <Provider createStore={useAuthStoreMock}>
        <PrivateRoute>
          <div>Protected Content</div>
        </PrivateRoute>
      </Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});