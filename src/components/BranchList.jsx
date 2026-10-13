import React from 'react';
import BranchCard from './BranchCard';
import EmptyState from './EmptyState';

/**
 * Grid of branch cards; `tillsByBranch` maps a branch id to its tills.
 */
const BranchList = ({ branches = [], tillsByBranch = {}, onDeactivateTill }) => {
  if (branches.length === 0)
    return <EmptyState title="No branches yet" description="Add your first branch to get started." />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {branches.map((branch) => (
        <BranchCard
          key={branch.id}
          branch={branch}
          tills={tillsByBranch[branch.id]}
          onDeactivateTill={onDeactivateTill}
        />
      ))}
    </div>
  );
};

export default BranchList;
