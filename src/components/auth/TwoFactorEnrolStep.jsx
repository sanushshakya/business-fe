// src/components/auth/TwoFactorEnrolStep.jsx

import React from 'react';
import { Button, Form, Input } from '@/components/ui';

/**
 * Set up an authenticator app: scan the QR code (or type the secret), then confirm with a code from the app.
 * `enrolment` is the `/auth/2fa/enrol/` answer; `onConfirm(code)` finishes it.
 */
const TwoFactorEnrolStep = ({ enrolment, onConfirm, onCancel, submitting = false, error }) => {
  const [code, setCode] = React.useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm(code);
  };

  // An <img> never runs scripts, so the server's SVG is shown this way rather than injected as HTML.
  const qrSrc = `data:image/svg+xml,${encodeURIComponent(enrolment.qr_svg)}`;

  return (
    <Form onSubmit={handleSubmit}>
      <p className="text-sm text-gray-700">
        Two-factor sign-in protects your account. Scan this code with an authenticator app (for example Google
        Authenticator or Microsoft Authenticator), then enter the 6-digit code it shows.
      </p>
      <img src={qrSrc} alt="QR code for your authenticator app" className="mx-auto h-48 w-48" />
      <div className="text-xs text-gray-600">
        Can&apos;t scan? Enter this key instead:
        <code className="mt-1 block break-all rounded bg-gray-100 p-2 font-mono text-sm text-gray-900">
          {enrolment.secret}
        </code>
      </div>
      <Input
        id="enrolCode"
        aria-label="6-digit code"
        placeholder="123 456"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Checking…' : 'Turn on'}
      </Button>
      {onCancel && (
        <button type="button" className="text-sm text-gray-600 underline" onClick={onCancel}>
          Cancel
        </button>
      )}
    </Form>
  );
};

export default TwoFactorEnrolStep;
