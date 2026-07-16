import React from 'react';
import { Card, Text, Badge, List, ListItem, Skeleton } from '@shadcn/ui';

/**
 * BranchCard component to display a single branch as a card with an expandable Till list.
 *
 * @param {Object} props - The properties for the BranchCard component.
 * @param {string} props.name - The name of the branch.
 * @param {string} props.address - The address of the branch.
 * @param {number} props.tills - The number of tills in the branch.
 * @param {number} props.staff - The number of staff members at the branch.
 * @param {boolean} props.isActive - Whether the branch is active or not.
 * @returns {React.FC} - The BranchCard component
 */
const BranchCard = ({ name, address, tills, staff, isActive, tillData }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <Card className="w-full">
      <div className="flex justify-between items-center">
        <Skeleton Text size="lg" count={1} />
        {/* Display active/inactive badge based on branch status */}
        <Badge variant={isActive ? 'success' : 'destructive'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
      <hr />
      <div className="mt-4 space-y-2">
        <Skeleton count={1} />
        <Skeleton count={1} />
        <Skeleton count={1} />
        {/* Add expand button */}
        <Button onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? 'Collapse Tills' : 'Expand Tills'}</Button>
      </div>
      {/* Conditionally render the Till list */}
      {isExpanded && (
        <List>
          {tillData.map((till, index) => (
            <ListItem key={index}>
              <Skeleton count={1} />
              {/* Add deactivate button for each till */}
              <Button onClick={() => deactivateTill(till.id)}>Deactivate</Button>
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );

  /**
   * Function to handle deactivating a till.
   *
   * @param {string} tillId - The ID of the till to deactivate.
   */
  const deactivateTill = (tillId) => {
    // Logic to deactivate the till
    console.log(`Deactivating till with ID: ${tillId}`);
  };
};

export default BranchCard;