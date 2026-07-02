# src/feature.py

import React from 'react';
import { Table, Modal, Button } from 'shadcn/ui';
import useSyncManager from '../hooks/useSyncManager';

/**
 * MySuppliersPanel component to display the UserSupplier list in a table and manage suppliers.
 * 
 * @returns {React.FC} - The MySuppliersPanel component
 */
const MySuppliersPanel: React.FC = () => {
  const { userSuppliers, openModal, closeModal } = useSyncManager();

  // Handle edge case when userSuppliers is undefined or null
  if (!userSuppliers) {
    return <div>No suppliers available.</div>;
  }

  // Validate userSuppliers to ensure it's an array
  if (!Array.isArray(userSuppliers)) {
    console.error('Invalid userSuppliers data format');
    return <div>Invalid data format. Please check the API response.</div>;
  }

  return (
    <div>
      <Table data={userSuppliers}>
        {/* Define the columns of the table */}
        <Table.Column title="Name" accessor="name" />
        <Table.Column title="Email" accessor="email" />
        <Table.Column title="Phone" accessor="phone" />
      </Table>

      {/* Add Supplier form in a sheet/drawer */}
      <Modal open={openModal} onClose={closeModal}>
        <Modal.Header>Add New Supplier</Modal.Header>
        <Modal.Body>
          {/* Form fields for adding a new supplier */}
          <input type="text" placeholder="Name" required />
          <input type="email" placeholder="Email" required />
          <input type="tel" placeholder="Phone" required />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary">Add Supplier</Button>
          <Button variant="outline" onClick={closeModal}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MySuppliersPanel;