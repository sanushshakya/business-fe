import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import PrivateRoute from '../PrivateRoute';
import useAuthStore from '../../stores/authStore';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <div>Secret</div>
            </PrivateRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe('PrivateRoute', () => {
  beforeEach(() => useAuthStore.getState().clearTokens());

  it('redirects signed-out users to /login', () => {
    renderAt('/dashboard');
    expect(screen.getByText('Login page')).toBeTruthy();
    expect(screen.queryByText('Secret')).toBeNull();
  });

  it('renders children once a token pair is stored', () => {
    useAuthStore.getState().setTokens({ access_token: 'a', refresh_token: 'r' });
    renderAt('/dashboard');
    expect(screen.getByText('Secret')).toBeTruthy();
  });
});
