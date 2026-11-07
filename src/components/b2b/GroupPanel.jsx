import React from 'react';
import { Button, Card, Input } from '@/components/ui';

/** Customer groups (G39): add, rename, or delete one (its customers keep trading, with no group). */
const GroupPanel = ({ groups, onAdd, onRename, onDelete, busy = false }) => {
  const [name, setName] = React.useState('');
  const [confirming, setConfirming] = React.useState(null);
  const [renaming, setRenaming] = React.useState(null); // {id, name} while a group is being renamed

  const rename = async (event) => {
    event.preventDefault();
    if (!renaming?.name.trim()) return;
    try {
      await onRename(renaming.id, renaming.name.trim());
      setRenaming(null);
    } catch {
      // the page shows the error; keep what was typed
    }
  };

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
            {renaming?.id === group.id ? (
              <form onSubmit={rename} className="flex gap-1">
                <Input
                  aria-label={`New name for ${group.name}`}
                  value={renaming.name}
                  onChange={(e) => setRenaming({ id: group.id, name: e.target.value })}
                />
                <Button type="submit" disabled={busy}>
                  Save
                </Button>
              </form>
            ) : (
              <button
                type="button"
                className="text-left"
                onClick={() => setRenaming({ id: group.id, name: group.name })}
                aria-label={`Rename ${group.name}`}
              >
                {group.name}
              </button>
            )}
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
