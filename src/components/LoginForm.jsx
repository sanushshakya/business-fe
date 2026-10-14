// src/components/LoginForm.jsx

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input } from '@/components/ui';
import { login, loginWithCode } from '../services/authService';
import { ME_KEY } from '../hooks/useMe';
import CodePad from './CodePad';

const TABS = [
  ['staff', 'Email'],
  ['till', 'Operator code'],
];

/**
 * Sign-in: email + password (/auth/login/) for staff, or an 8-digit code (/auth/till-login/) for till operators.
 */
const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = React.useState('staff');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const signIn = async (attempt, destination, badCredentials) => {
    setError(null);
    setSubmitting(true);
    try {
      await attempt();
      queryClient.removeQueries({ queryKey: ME_KEY }); // do not show the last person's role to this one
      navigate(destination, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 400 || status === 401
          ? badCredentials
          : status === 429
            ? 'Too many attempts. Wait a minute and try again.'
            : 'Could not reach the server. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    signIn(() => login(email, password), location.state?.from?.pathname || '/dashboard', 'Invalid email or password.');
  };

  const handleCode = (code) => signIn(() => loginWithCode(code), '/dashboard', 'That code was not recognised.');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-4 text-xl font-bold">Sign in</h1>
        <div className="mb-4 grid grid-cols-2 gap-2" role="tablist">
          {TABS.map(([id, label]) => (
            <Button
              key={id}
              role="tab"
              aria-selected={mode === id}
              variant={mode === id ? 'primary' : 'secondary'}
              onClick={() => switchMode(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        {mode === 'till' ? (
          <CodePad onSubmit={handleCode} disabled={submitting} error={error} />
        ) : (
          <Form onSubmit={handleSubmit}>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              aria-label="Email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default LoginForm;
