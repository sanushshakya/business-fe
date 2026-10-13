import React from 'react';
import { Button, Step, StepLabel, Stepper } from '@/components/ui';

/**
 * Multi-step flow. `steps` is `[{label, content}]`; `onFinish` runs on the last step.
 */
const OnboardingStepper = ({ steps, onFinish }) => {
  const [active, setActive] = React.useState(0);
  const last = active === steps.length - 1;

  return (
    <div className="space-y-6">
      <Stepper activeStep={active}>
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div>{steps[active].content}</div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setActive((i) => i - 1)} disabled={active === 0}>
          Back
        </Button>
        {last ? (
          <Button onClick={onFinish}>Finish</Button>
        ) : (
          <Button onClick={() => setActive((i) => i + 1)}>Next</Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingStepper;
