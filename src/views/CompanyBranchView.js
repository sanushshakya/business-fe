// src/views/CompanyBranchView.js

import React from 'react';
import { Button, Table } from 'shadcn/ui';
import useSyncManager from '../hooks/useSyncManager';

/**
 * CompanyBranchView component to display the CompanyBranch list in a table and manage branches.
 *
 * @returns {React.FC} - The CompanyBranchView component
 */
const CompanyBranchView: React.FC = () => {
  const { companyBranches, openModal, closeModal } = useSyncManager();

  // Handle edge case when companyBranches is undefined or null
  if (!companyBranches) return <div>Loading...</div>;

  /**
   * Render the table header.
   *
   * @returns {JSX.Element} - The rendered table header
   */
  const renderHeader = () => (
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Location</th>
        <th>Action</th>
      </tr>
    </thead>
  );

  /**
   * Render the table body.
   *
   * @returns {JSX.Element} - The rendered table body
   */
  const renderBody = () => (
    <tbody>
      {companyBranches.map((branch) => (
        <tr key={branch.id}>
          <td>{branch.id}</td>
          <td>{branch.name}</td>
          <td>{branch.location}</td>
          <td>
            <Button onClick={() => openModal(branch)}>Edit</Button>
            <Button onClick={() => handleDelete(branch)}>Delete</Button>
          </td>
        </tr>
      ))}
    </tbody>
  );

  /**
   * Handle delete action for a company branch.
   *
   * @param {Object} branch - The company branch to be deleted
   */
  const handleDelete = (branch) => {
    // Logic to handle the deletion of a company branch
  };

  return (
    <div>
      <Button onClick={() => openModal(null)}>Add New Branch</Button>
      <Table>
        {renderHeader()}
        {renderBody()}
      </Table>
    </div>
  );
};

export default CompanyBranchView;