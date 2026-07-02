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
    return <div>No suppliers available</div>;
  }

  // Validate each supplier object for expected properties
  const validatedSuppliers = userSuppliers.map((supplier) => {
    if (!supplier.id || !supplier.name || !supplier.email) {
      console.error('Invalid supplier data:', supplier);
      return null;
    }
    return supplier;
  }).filter(Boolean); // Filter out any suppliers that failed validation

  return (
    <div>
      <Table data={validatedSuppliers}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {validatedSuppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td>{supplier.name}</td>
              <td>{supplier.email}</td>
              <td>
                <Button onClick={() => openModal(supplier)}>Edit</Button>
                <Button onClick={() => closeModal()}>Cancel</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal open={true} onOpenChange={(open) => open ? null : closeModal()}>
        {/* Modal content will be managed by useSyncManager */}
      </Modal>
    </div>
  );
};

export default MySuppliersPanel;