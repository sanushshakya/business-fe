import React, { useState } from 'react';
import axios from '../utils/axios';

/**
 * ResetPassword component to handle password reset.
 *
 * @returns {React.FC} - The ResetPassword component
 */
const ResetPassword: React.FC = ({ token }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Handles form submission for password reset.
   *
   * @param {React.FormEvent} event - The form submission event
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response ? err.response.data.message : 'An error occurred');
    }
  };

  if (success) {
    return (
      <div>
        <h1>Password Reset Successful</h1>
        <p>Redirecting to login page...</p>
        {window.location.replace('/login')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="password">New Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="confirmPassword">Confirm New Password:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Reset Password</button>
    </form>
  );
};

export default ResetPassword;