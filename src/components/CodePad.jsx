import React from 'react';
import { Button } from '@/components/ui';

export const CODE_LENGTH = 8;

/**
 * Entry for an 8-digit till code: a masked field that also takes the keyboard, plus an on-screen keypad for
 * touch tills. Calls `onSubmit(code)` as soon as the last digit is in.
 */
const CodePad = ({ onSubmit, disabled = false, error }) => {
  const [code, setCode] = React.useState('');

  const update = (next) => {
    const digits = next.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) onSubmit(digits);
  };

  // A refused code is cleared so the next attempt starts fresh.
  React.useEffect(() => {
    if (error) setCode('');
  }, [error]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tillCode" className="mb-1 block text-sm font-medium">
          Your 8-digit code
        </label>
        <input
          id="tillCode"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={CODE_LENGTH}
          value={code}
          disabled={disabled}
          onChange={(e) => update(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-3 text-center text-2xl tracking-[0.5em] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        <p className="mt-1 text-center text-xs text-gray-500" aria-live="polite">
          {code.length} of {CODE_LENGTH} digits
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <Button
            key={digit}
            variant="secondary"
            className="py-3 text-lg"
            disabled={disabled}
            onClick={() => update(code + digit)}
          >
            {digit}
          </Button>
        ))}
        <Button variant="secondary" className="py-3" disabled={disabled} onClick={() => setCode('')}>
          Clear
        </Button>
        <Button variant="secondary" className="py-3 text-lg" disabled={disabled} onClick={() => update(`${code}0`)}>
          0
        </Button>
        <Button
          variant="secondary"
          className="py-3"
          disabled={disabled}
          aria-label="Delete last digit"
          onClick={() => setCode(code.slice(0, -1))}
        >
          ⌫
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default CodePad;
