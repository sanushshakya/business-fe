import React from 'react';
import { Button } from '@/components/ui';

/**
 * Centered "nothing here yet" message with an optional call to action.
 */
const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <h2 className="text-lg font-medium text-gray-800">{title}</h2>
    {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
    {actionLabel && onAction && (
      <Button className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;
