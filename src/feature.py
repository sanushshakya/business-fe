// src/feature.py

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

  // Validate that userSuppliers is an array to avoid potential errors in the table rendering
  if (!Array.isArray(userSuppliers)) {
    console.error('userSuppliers should be an array but received:', userSuppliers);
    return null;
  }

  return (
    <div>
      <Table data={userSuppliers}>
        {/* Table columns and rows */}
      </Table>

      <Modal open={openModal} onClose={closeModal}>
        {/* Modal content for supplier management */}
      </Modal>
    </div>
  );
};

export default MySuppliersPanel;