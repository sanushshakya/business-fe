// src/components/LoginForm.jsx

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Form, Input } from '@/components/ui';
import { confirmEnrolment, login, loginWithCode, startEnrolment, verifyTwoFactor } from '../services/authService';
import { ME_KEY } from '../hooks/useMe';
import CodePad from './CodePad';
import RecoveryCodes from './auth/RecoveryCodes';
import TwoFactorCodeStep from './auth/TwoFactorCodeStep';
import TwoFactorEnrolStep from './auth/TwoFactorEnrolStep';

const TABS = [
  ['staff', 'Email'],
  ['till', 'Operator code'],
];

const errorText = (err, badCredentials) => {
  const status = err.response?.status;
  if (status === 400 || status === 401) return badCredentials;
  if (status === 429) return 'Too many attempts. Wait a minute and try again.';
  return 'Could not reach the server. Please try again.';
};

/**
 * Sign-in: email + password (/auth/login/) for staff, or an 8-digit code (/auth/code-login/) for operators.
 *
 * With two-factor on, the password step returns a challenge and the form moves to `verify` (a code from the app)
 * or, for an admin who has not set it up, `enrol` (scan, confirm, then the recovery codes are shown once).
 */
const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = React.useState('staff');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(null);
  const [submitting, setSubmitting] = React.useState(false);
  // Two-factor: 'password' (no second step yet), 'verify', 'enrol' or 'codes' (recovery codes on screen).
  const [step, setStep] = React.useState('password');
  const [challenge, setChallenge] = React.useState(null);
  const [enrolment, setEnrolment] = React.useState(null);
  const [recoveryCodes, setRecoveryCodes] = React.useState([]);

  const destination = location.state?.from?.pathname || '/dashboard';

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const finish = (to) => {
    queryClient.removeQueries({ queryKey: ME_KEY }); // do not show the last person's role to this one
    navigate(to, { replace: true });
  };

  const restart = (message = null) => {
    setStep('password');
    setChallenge(null);
    setEnrolment(null);
    setPassword('');
    setError(message);
  };

  const run = async (attempt, badCredentials) => {
    setError(null);
    setSubmitting(true);
    try {
      await attempt();
    } catch (err) {
      setError(errorText(err, badCredentials));
    } finally {
      setSubmitting(false);
    }
  };

  // A 401 on a second-step call means the challenge expired or was used up: start again from the password.
  const runStep = (attempt) =>
    run(async () => {
      try {
        await attempt();
      } catch (err) {
        if (err.response?.status === 401) {
          restart('This sign-in has expired. Sign in again.');
          return;
        }
        throw err;
      }
    }, 'That code is not right. Check the time on your phone and try again.');

  const handleSubmit = (event) => {
    event.preventDefault();
    run(async () => {
      const next = await login(email, password);
      if (!next) {
        finish(destination);
        return;
      }
      setChallenge(next.challenge);
      if (next.step === 'enrol') setEnrolment(await startEnrolment(next.challenge));
      setStep(next.step);
    }, 'Invalid email or password.');
  };

  const handleVerify = (answer) =>
    runStep(async () => {
      await verifyTwoFactor(challenge, answer);
      finish(destination);
    });

  const handleEnrolConfirm = (code) =>
    runStep(async () => {
      setRecoveryCodes(await confirmEnrolment(code, challenge));
      setStep('codes');
    });

  const handleCode = (code) =>
    run(async () => {
      await loginWithCode(code);
      finish('/dashboard');
    }, 'That code was not recognised.');

  if (step !== 'password') {
    const titles = {
      verify: 'Two-factor sign-in',
      enrol: 'Set up two-factor sign-in',
      codes: 'Save your recovery codes',
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm p-6">
          <h1 className="mb-4 text-xl font-bold">{titles[step]}</h1>
          {step === 'verify' && (
            <TwoFactorCodeStep
              onSubmit={handleVerify}
              onCancel={() => restart()}
              submitting={submitting}
              error={error}
            />
          )}
          {step === 'enrol' && enrolment && (
            <TwoFactorEnrolStep
              enrolment={enrolment}
              onConfirm={handleEnrolConfirm}
              onCancel={() => restart()}
              submitting={submitting}
              error={error}
            />
          )}
          {step === 'codes' && <RecoveryCodes codes={recoveryCodes} onDone={() => finish(destination)} />}
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="mb-4 text-xl font-bold">Sign in</h1>
        <div className="mb-4 grid grid-cols-2 gap-2" role="tablist">
          {TABS.map(([id, label]) => (
            <Button
              key={id}
              role="tab"
              aria-selected={mode === id}
              variant={mode === id ? 'primary' : 'secondary'}
              onClick={() => switchMode(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        {mode === 'till' ? (
          <CodePad onSubmit={handleCode} disabled={submitting} error={error} />
        ) : (
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
        )}
      </Card>
    </div>
  );
};

export default LoginForm;
