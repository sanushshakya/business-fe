// src/components/LoginForm.jsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input } from '@/components/ui';
import { login } from '../services/authService';

/**
 * Email + password sign-in against the backend's /auth/login/.
 */
const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 400 || status === 401
          ? 'Invalid email or password.'
          : 'Could not reach the server. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-4 text-xl font-bold">Sign in</h1>
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
      </Card>
    </div>
  );
};

export default LoginForm;
