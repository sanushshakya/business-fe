import React from 'react';
import { Badge } from '@/components/ui';

const formatTime = (iso) => (iso ? new Date(iso).toLocaleString() : 'never');

/**
 * Header badge for the online shop sync (`useStorefrontSync`): green in sync, amber waiting, red failing.
 * Details are in the hover text. Renders nothing before the first status or without a shop connection.
 */
const StorefrontSyncBadge = ({ status, disconnected = false }) => {
  if (!status || status.state === 'off') return null;
  const details = [
    `Last stock push: ${formatTime(status.last_push_at)}`,
    `${status.backlog} waiting, ${status.failed} failed`,
    status.last_error && `Last error: ${status.last_error}`,
  ]
    .filter(Boolean)
    .join('\n');

  if (disconnected) {
    return (
      <Badge color="gray" title="The live shop status is reconnecting">
        Shop status offline
      </Badge>
    );
  }
  if (status.state === 'red') {
    return (
      <Badge color="red" title={details}>
        Shop sync failing
      </Badge>
    );
  }
  if (status.state === 'amber') {
    return (
      <Badge color="yellow" title={details}>
        Shop: {status.backlog} waiting
      </Badge>
    );
  }
  return (
    <Badge color="green" title={details}>
      Shop in sync
    </Badge>
  );
};

export default StorefrontSyncBadge;
