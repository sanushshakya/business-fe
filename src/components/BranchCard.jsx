import React from 'react';
import { Badge, Button, Card, List, ListItem } from '@/components/ui';

/**
 * A branch with an expandable list of its tills.
 *
 * @param {{name: string, address: string, is_active: boolean}} branch
 * @param {{id: number, name?: string}[]} [tills]
 * @param {(till: object) => void} [onDeactivateTill]
 */
const BranchCard = ({ branch, tills = [], onDeactivateTill }) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card className="w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{branch.name}</h3>
        <Badge color={branch.is_active ? 'green' : 'red'}>{branch.is_active ? 'Active' : 'Inactive'}</Badge>
      </div>
      <p className="mt-2 text-sm text-gray-600">{branch.address}</p>
      <Button variant="secondary" className="mt-3" onClick={() => setExpanded((open) => !open)}>
        {expanded ? 'Hide tills' : `Show tills (${tills.length})`}
      </Button>
      {expanded && (
        <List className="mt-2">
          {tills.length === 0 && <ListItem>No tills.</ListItem>}
          {tills.map((till) => (
            <ListItem key={till.id} className="flex items-center justify-between">
              <span>{till.name ?? `Till #${till.id}`}</span>
              {onDeactivateTill && (
                <Button variant="danger" onClick={() => onDeactivateTill(till)}>
                  Deactivate
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
};

export default BranchCard;
