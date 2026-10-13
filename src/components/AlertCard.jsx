// src/components/AlertCard.jsx

import React from 'react';
import { Button, Card } from '@/components/ui';

/**
 * A titled alert with detail lines and an optional dismiss action.
 *
 * @param {string} title
 * @param {string[]} [details]
 * @param {() => void} [onDismiss]
 */
const AlertCard = ({ title, details = [], onDismiss }) => (
  <Card>
    <h2 className="text-lg font-bold">{title}</h2>
    {details.map((line) => (
      <p key={line} className="mt-1 text-sm text-gray-600">
        {line}
      </p>
    ))}
    {onDismiss && (
      <Button variant="secondary" className="mt-3" onClick={onDismiss}>
        Dismiss
      </Button>
    )}
  </Card>
);

export default AlertCard;
