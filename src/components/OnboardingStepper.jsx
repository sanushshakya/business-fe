// src/components/OnboardingStepper.jsx
import React from 'react';
import { Stepper, Step, StepLabel } from '@shadcn/ui';

/**
 * OnboardingStepper component for guiding users through the onboarding process.
 *
 * @returns {React.FC} - The OnboardingStepper component
 */
const OnboardingStepper: React.FC = () => {
  const steps = [
    {
      label: 'Company Profile',
      content: <div>Step 1: Enter Company Name, Registration Number, and Address</div>,
    },
    {
      label: 'Contact Information',
      content: <div>Step 2: Add Contact Person Details</div>,
    },
    {
      label: 'Payment Terms',
      content: <div>Step 3: Set Payment Conditions</div>,
    },
    {
      label: 'Review and Confirm',
      content: <div>Step 4: Review Information and Confirm</div>,
    },
  ];

  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Stepper activeStep={activeStep}>
      {steps.map((step, index) => (
        <Step key={index} completed={index < activeStep}>
          <StepLabel>{step.label}</StepLabel>
        </Step>
      ))}
      <div style={{ marginTop: '2rem' }}>
        {activeStep === steps.length - 1 ? (
          <Button type="submit">Finish</Button>
        ) : (
          <>
            <Button onClick={handleBack} disabled={activeStep === 0}>
              Back
            </Button>
            <Button onClick={handleNext}>Next</Button>
          </>
        )}
      </div>
    </Stepper>
  );
};

export default OnboardingStepper;