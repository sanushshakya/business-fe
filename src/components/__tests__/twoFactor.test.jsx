import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from '../../utils/axios';
import useAuthStore from '../../stores/authStore';
import LoginForm from '../LoginForm';

vi.mock('../../utils/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const CODES = Array.from({ length: 10 }, (_, i) => `aaaa${i}-bbbbb`);
const ENROLMENT = {
  secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
  otpauth_uri: 'otpauth://totp/x',
  qr_svg: '<svg></svg>',
};

const renderLogin = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<div>The dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

const signIn = () => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'staff@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw-12345678' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
};

const reply = (routes) =>
  axios.post.mockImplementation((url) => {
    const answer = routes[url];
    if (!answer) return Promise.reject(new Error(`unexpected ${url}`));
    return typeof answer === 'function' ? answer() : Promise.resolve({ data: answer });
  });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useAuthStore.getState().clearTokens();
});

describe('Sign-in with two-factor', () => {
  it('asks for a code and stores no tokens until it is right', async () => {
    reply({
      '/auth/login/': { two_factor: 'verify', challenge: 'ch-1', expires_in: 300 },
      '/auth/2fa/verify/': { access_token: 'a', refresh_token: 'r' },
    });
    renderLogin();
    signIn();
    const field = await screen.findByLabelText('6-digit code');
    expect(useAuthStore.getState().accessToken).toBeNull();
    fireEvent.change(field, { target: { value: '123 456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
    await screen.findByText('The dashboard');
    expect(axios.post).toHaveBeenCalledWith('/auth/2fa/verify/', { challenge: 'ch-1', code: '123456' });
    expect(useAuthStore.getState().accessToken).toBe('a');
  });

  it('takes a recovery code instead', async () => {
    reply({
      '/auth/login/': { two_factor: 'verify', challenge: 'ch-1', expires_in: 300 },
      '/auth/2fa/verify/': { access_token: 'a', refresh_token: 'r' },
    });
    renderLogin();
    signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Use a recovery code' }));
    fireEvent.change(screen.getByLabelText('Recovery code'), { target: { value: 'abcde-fghij' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
    await screen.findByText('The dashboard');
    expect(axios.post).toHaveBeenCalledWith('/auth/2fa/verify/', { challenge: 'ch-1', recovery_code: 'abcde-fghij' });
  });

  it('says so when the code is wrong and lets them try again', async () => {
    reply({
      '/auth/login/': { two_factor: 'verify', challenge: 'ch-1', expires_in: 300 },
      '/auth/2fa/verify/': () => Promise.reject({ response: { status: 400 } }),
    });
    renderLogin();
    signIn();
    fireEvent.change(await screen.findByLabelText('6-digit code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('That code is not right.');
    expect(screen.getByLabelText('6-digit code')).toBeInTheDocument();
  });

  it('goes back to the password form when the sign-in expired', async () => {
    reply({
      '/auth/login/': { two_factor: 'verify', challenge: 'ch-1', expires_in: 300 },
      '/auth/2fa/verify/': () => Promise.reject({ response: { status: 401 } }),
    });
    renderLogin();
    signIn();
    fireEvent.change(await screen.findByLabelText('6-digit code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign in again.');
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('walks an admin through set-up, shows the recovery codes once, then continues', async () => {
    reply({
      '/auth/login/': { two_factor: 'enrol', challenge: 'ch-2', expires_in: 300 },
      '/auth/2fa/enrol/': ENROLMENT,
      '/auth/2fa/enrol/confirm/': { recovery_codes: CODES, access_token: 'a', refresh_token: 'r' },
    });
    renderLogin();
    signIn();
    const qr = await screen.findByRole('img', { name: 'QR code for your authenticator app' });
    expect(qr.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
    expect(axios.post).toHaveBeenCalledWith('/auth/2fa/enrol/', { challenge: 'ch-2' });
    expect(screen.getByText(ENROLMENT.secret)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));
    await screen.findByText(CODES[0]);
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(axios.post).toHaveBeenCalledWith('/auth/2fa/enrol/confirm/', { challenge: 'ch-2', code: '654321' });
    expect(screen.queryByText('The dashboard')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: "I've saved these codes" }));
    await screen.findByText('The dashboard');
    expect(useAuthStore.getState().accessToken).toBe('a');
  });

  it('still signs in without two-factor when the server sends tokens', async () => {
    reply({ '/auth/login/': { access_token: 'a', refresh_token: 'r' } });
    renderLogin();
    signIn();
    await screen.findByText('The dashboard');
    await waitFor(() => expect(useAuthStore.getState().accessToken).toBe('a'));
  });
});
