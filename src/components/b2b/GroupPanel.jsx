import React from 'react';
import { Button, Card, Input } from '@/components/ui';

/** Customer groups (G39): add one, or delete one (its customers keep trading, with no group). */
const GroupPanel = ({ groups, onAdd, onDelete, busy = false }) => {
  const [name, setName] = React.useState('');
  const [confirming, setConfirming] = React.useState(null);

  const add = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await onAdd(name.trim());
      setName('');
    } catch {
      // the page shows the error; keep what was typed
    }
  };

  return (
    <Card className="space-y-3 p-4">
      <h3 className="font-medium">Customer groups</h3>
      <ul className="space-y-1 text-sm">
        {groups.map((group) => (
          <li key={group.id} className="flex items-center justify-between gap-2">
            <span>{group.name}</span>
            {confirming === group.id ? (
              <span className="flex gap-2">
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => onDelete(group).finally(() => setConfirming(null))}
                  aria-label={`Yes, delete ${group.name}`}
                >
                  Delete
                </Button>
                <Button variant="secondary" onClick={() => setConfirming(null)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setConfirming(group.id)}
                aria-label={`Delete group ${group.name}`}
              >
                ×
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex gap-2">
        <Input aria-label="New group" placeholder="New group" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={busy}>
          Add group
        </Button>
      </form>
    </Card>
  );
};

export default GroupPanel;
