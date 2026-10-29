// src/components/TwoFactorPanel.jsx

import React from 'react';
import { Badge, Button, Form, Input } from '@/components/ui';
import { apiErrorMessage } from '../utils/http';
import RecoveryCodes from './auth/RecoveryCodes';
import TwoFactorEnrolStep from './auth/TwoFactorEnrolStep';

/**
 * Two-factor sign-in for the signed-in user: on/off, set it up, or turn it off (not for admins, who must keep it).
 *
 * @param {{enabled: boolean, required: boolean, recovery_codes_left: number}} status
 * @param {() => Promise<object>} start      begins set-up, resolves to `{secret, otpauth_uri, qr_svg}`
 * @param {(code: string) => Promise<string[]>} confirm   finishes set-up, resolves to the recovery codes
 * @param {(code: string) => Promise} disable
 * @param {() => void} onChanged   called once the status changed (the page refetches it)
 */
const TwoFactorPanel = ({ status, start, confirm, disable, onChanged }) => {
  // 'idle', 'enrol', 'codes' or 'disable'
  const [view, setView] = React.useState('idle');
  const [enrolment, setEnrolment] = React.useState(null);
  const [codes, setCodes] = React.useState([]);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const attempt = async (work) => {
    setError(null);
    setBusy(true);
    try {
      await work();
    } catch (err) {
      setError(apiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const begin = () =>
    attempt(async () => {
      setEnrolment(await start());
      setView('enrol');
    });

  const finishEnrol = (value) =>
    attempt(async () => {
      setCodes(await confirm(value));
      setView('codes');
    });

  const turnOff = (event) => {
    event.preventDefault();
    attempt(async () => {
      await disable(code.replace(/\s/g, ''));
      setCode('');
      setView('idle');
      onChanged();
    });
  };

  const reset = () => {
    setView('idle');
    setError(null);
    setCode('');
  };

  return (
    <section className="max-w-md space-y-3">
      <h2 className="text-xl font-semibold">Two-factor sign-in</h2>
      <p className="flex items-center gap-2 text-sm text-gray-700">
        <Badge color={status.enabled ? 'green' : 'gray'}>{status.enabled ? 'On' : 'Off'}</Badge>
        {status.enabled && <span>{status.recovery_codes_left} recovery codes left</span>}
      </p>
      {status.required && <p className="text-sm text-gray-600">Admins must keep two-factor sign-in on.</p>}

      {view === 'idle' && !status.enabled && (
        <Button onClick={begin} disabled={busy}>
          Set up two-factor sign-in
        </Button>
      )}
      {view === 'idle' && status.enabled && !status.required && (
        <Button variant="secondary" onClick={() => setView('disable')}>
          Turn off
        </Button>
      )}

      {view === 'enrol' && enrolment && (
        <TwoFactorEnrolStep
          enrolment={enrolment}
          onConfirm={finishEnrol}
          onCancel={reset}
          submitting={busy}
          error={error}
        />
      )}
      {view === 'codes' && (
        <RecoveryCodes
          codes={codes}
          onDone={() => {
            setView('idle');
            onChanged();
          }}
        />
      )}
      {view === 'disable' && (
        <Form onSubmit={turnOff}>
          <Input
            id="disableCode"
            aria-label="6-digit code"
            placeholder="123 456"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={busy}>
              Confirm turn off
            </Button>
            <Button variant="secondary" onClick={reset}>
              Cancel
            </Button>
          </div>
        </Form>
      )}
      {error && view !== 'enrol' && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
};

export default TwoFactorPanel;
