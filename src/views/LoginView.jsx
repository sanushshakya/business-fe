import React, { useEffect, useState } from 'react';
import { Stepper, Step, StepLabel, Box } from '@shadcn/ui';
import { useAuthStore } from '../stores/authStore';

/**
 * LoginView component to handle the login flow and onboarding stepper.
 *
 * @returns {React.FC} - The LoginView component
 */
const LoginView: React.FC = () => {
  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const authStore = useAuthStore();

  useEffect(() => {
    // Check if it's the user's first login
    const isFirstTime = localStorage.getItem('firstLogin');
    setIsFirstLogin(isFirstTime === null);

    // If it's the first login, set a flag in local storage
    if (isFirstTime === null) {
      localStorage.setItem('firstLogin', 'true');
    }
  }, []);

  useEffect(() => {
    if (!authStore.isAuthenticated && isFirstLogin) {
      authStore.login(); // Trigger the login flow
    }
  }, [authStore.isAuthenticated, isFirstLogin]);

  const steps = [
    { label: 'Welcome' },
    { label: 'Company Profile' },
    { label: 'Contact Information' },
    { label: 'Complete Setup' },
  ];

  const content = (
    <Box sx={{ mt: 2 }}>
      {/* Stepper component */}
      <Stepper activeStep={0}>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );

  return (
    <>
      {/* Login form and onboarding stepper conditional rendering */}
      {!authStore.isAuthenticated ? (
        <div>Login Form</div> // Placeholder for the login form
      ) : isFirstLogin ? (
        content
      ) : (
        <div>Main Dashboard Content</div> // Placeholder for the main dashboard content
      )}
    </>
  );
};

export default LoginView;