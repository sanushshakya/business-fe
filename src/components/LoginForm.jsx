// src/components/LoginForm.jsx

import React from 'react';
import { Card, Input } from '@shadcn/ui';
import axios from 'axios';
import useAuthStore from '@/store/auth';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

/**
 * LoginForm component to handle user registration with email and password.
 * Uses shadcn/ui's Card and Input components for the form layout.
 */
const LoginForm = () => {
  const authStore = useAuthStore();
  const navigate = useNavigate(); // Hook to access navigation functionality

  // State to hold the email input value
  const [email, setEmail] = React.useState('');

  // State to hold the password input value
  const [password, setPassword] = React.useState('');

  /**
   * Handles changes in the email input field.
   * @param {Event} event - The input change event.
   */
  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  /**
   * Handles changes in the password input field.
   * @param {Event} event - The input change event.
   */
  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  /**
   * Validates the form fields and submits the registration form.
   * If validation fails, it prevents the default form submission.
   * @param {Event} event - The form submission event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      alert('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    try {
      const response = await axios.post('/api/register', { email, password });
      const { token } = response.data;

      // Store the JWT token in local storage or a secure cookie
      authStore.setAccessToken(token);

      // Redirect to the home page after successful registration
      navigate('/'); // Use navigate for redirection
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    }
  };

  /**
   * Validates an email address using a regular expression.
   * @param {string} email - The email address to validate.
   * @returns {boolean} True if the email is valid, false otherwise.
   */
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <Card className="w-[400px] p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email input field */}
        <Input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          required
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:border-blue-500"
        />
        {/* Password input field */}
        <Input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          required
          className="border border-gray-300 rounded-md p-2 focus:outline-none focus:border-blue-500"
        />
        {/* Submit button */}
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600">
          Register
        </button>
      </form>
    </Card>
  );
};

export default LoginForm;