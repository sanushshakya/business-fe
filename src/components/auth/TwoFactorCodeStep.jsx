// src/components/auth/TwoFactorCodeStep.jsx

import React from 'react';
import { Button, Form, Input } from '@/components/ui';

/**
 * Second sign-in step: the 6-digit code from the authenticator app, or (after "Use a recovery code") one of the
 * recovery codes. Calls `onSubmit({code})` or `onSubmit({recoveryCode})`.
 */
const TwoFactorCodeStep = ({ onSubmit, onCancel, submitting = false, error }) => {
  const [useRecovery, setUseRecovery] = React.useState(false);
  const [value, setValue] = React.useState('');

  const toggle = () => {
    setUseRecovery((current) => !current);
    setValue('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(useRecovery ? { recoveryCode: value.trim() } : { code: value });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <p className="text-sm text-gray-700">
        {useRecovery
          ? 'Enter one of the recovery codes you saved when you set up two-factor sign-in.'
          : 'Open your authenticator app and enter the 6-digit code for Business IQ.'}
      </p>
      <Input
        id="twoFactorCode"
        aria-label={useRecovery ? 'Recovery code' : '6-digit code'}
        placeholder={useRecovery ? 'xxxxx-xxxxx' : '123 456'}
        inputMode={useRecovery ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        autoFocus
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Checking…' : 'Verify'}
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" className="text-primary underline" onClick={toggle}>
          {useRecovery ? 'Use the app code' : 'Use a recovery code'}
        </button>
        {onCancel && (
          <button type="button" className="text-gray-600 underline" onClick={onCancel}>
            Back
          </button>
        )}
      </div>
    </Form>
  );
};

export default TwoFactorCodeStep;
