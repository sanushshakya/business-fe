import React from 'react';
import { Button, Card, Form, Input } from '@/components/ui';
import axios from '../utils/axios';

/**
 * Confirms a password reset using the `uidb64` and `token` from the emailed link.
 * Calls `onDone` after a successful reset (typically to navigate to /login).
 */
const ResetPassword = ({ uidb64, token, onDone }) => {
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await axios.post('/auth/password_reset/confirm/', {
        uidb64,
        token,
        new_password1: password,
        new_password2: confirm,
      });
      setSuccess(true);
      onDone?.();
    } catch (err) {
      setError(
        err.response?.status === 400
          ? 'This reset link is invalid or the password is too weak.'
          : 'Something went wrong. Try again.'
      );
    }
  };

  if (success) return <p role="status">Password reset. You can now sign in.</p>;

  return (
    <Card className="mx-auto w-full max-w-sm">
      <Form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium">
            New password
          </label>
          <Input
            id="newPassword"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit">Reset password</Button>
      </Form>
    </Card>
  );
};

export default ResetPassword;
