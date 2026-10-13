import React from 'react';
import { Badge, Button } from '@/components/ui';
import { useOffline } from '../offline/OfflineProvider';

/** Header indicator for offline-saved records: syncing, waiting to sync, or rejected by the server. */
const SyncStatus = () => {
  const { isSyncing, pending, failed, retryFailed } = useOffline();

  if (isSyncing) return <Badge color="blue">Syncing…</Badge>;
  if (pending === 0 && failed === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {pending > 0 && <Badge color="yellow">{pending} waiting to sync</Badge>}
      {failed > 0 && (
        <>
          <Badge color="red">{failed} rejected</Badge>
          <Button variant="secondary" onClick={retryFailed}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
};

export default SyncStatus;
