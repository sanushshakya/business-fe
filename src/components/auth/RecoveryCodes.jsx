// src/components/auth/RecoveryCodes.jsx

import React from 'react';
import { Button } from '@/components/ui';

/** The 10 recovery codes, shown once right after two-factor sign-in is turned on. */
const RecoveryCodes = ({ codes, onDone }) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-700">
      Two-factor sign-in is on. Save these recovery codes somewhere safe (print them or keep them in a password
      manager). Each one works once, if you lose your phone. They will not be shown again.
    </p>
    <ul className="grid grid-cols-2 gap-2 rounded bg-gray-100 p-3 font-mono text-sm text-gray-900">
      {codes.map((code) => (
        <li key={code}>{code}</li>
      ))}
    </ul>
    <Button className="w-full" onClick={onDone}>
      I&apos;ve saved these codes
    </Button>
  </div>
);

export default RecoveryCodes;
