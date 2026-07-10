import React from 'react';
import { Card, Text, Badge } from '@shadcn/ui';

/**
 * BranchCard component to display a single branch as a card.
 *
 * @param {Object} props - The properties for the BranchCard component.
 * @param {string} props.name - The name of the branch.
 * @param {string} props.address - The address of the branch.
 * @param {number} props.tills - The number of tills in the branch.
 * @param {number} props.staff - The number of staff members at the branch.
 * @param {boolean} props.isActive - Whether the branch is active or not.
 * @returns {React.FC} - The BranchCard component
 */
const BranchCard = ({ name, address, tills, staff, isActive }) => {
  return (
    <Card className="w-full">
      <div className="flex justify-between items-center">
        <Text size="lg">{name}</Text>
        <Badge variant={isActive ? 'success' : 'destructive'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
      <hr />
      <div className="mt-4 space-y-2">
        <p><strong>Address:</strong> {address}</p>
        <p><strong>Tills:</strong> {tills}</p>
        <p><strong>Staff:</strong> {staff}</p>
      </div>
    </Card>
  );
};

export default BranchCard;