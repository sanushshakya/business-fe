// src/components/BranchList.jsx

import React from 'react';
import { Card, Badge, Button } from 'shadcn/ui';

/**
 * BranchList component to display a list of branches as cards and include a button for adding new branches.
 *
 * @param {Object} props - The properties passed to the BranchList component
 * @param {Array} props.branches - An array of branch objects to be displayed
 * @returns {React.FC} - The BranchList component
 */
const BranchList: React.FC<{ branches: Array<{ id: string, name: string, address: string, tills: number, staff: number, active: boolean }> }> = ({ branches }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {branches.map((branch) => (
        <Card key={branch.id} className="shadow-md rounded-lg overflow-hidden">
          <div className="p-4">
            <h3 className="text-xl font-bold">{branch.name}</h3>
            <p className="mt-2 text-gray-600">{branch.address}</p>
            <div className="flex items-center mt-4 space-x-4">
              <div>
                <span className="font-semibold">Tills:</span> {branch.tills}
              </div>
              <div>
                <span className="font-semibold">Staff:</span> {branch.staff}
              </div>
            </div>
            <div className="mt-4">
              {branch.active ? (
                <Badge color="green">Active</Badge>
              ) : (
                <Badge color="red">Inactive</Badge>
              )}
            </div>
          </div>
        </Card>
      ))}
      
      {/* Add Branch button */}
      <Button asChild variant="secondary" size="sm">
        <a href="/add-branch">Add Branch</a>
      </Button>
    </div>
  );
};

export default BranchList;