import React from 'react';
import { Table, Modal, Button } from 'shadcn/ui';
import ScrollableTable from './ScrollableTable'; // Import the new ScrollableTable component
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
      {/* Use ScrollableTable to wrap the Table component for horizontal scrolling */}
      <ScrollableTable data={userSuppliers}>
        {/* Define table columns */}
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Branch</th>
          </tr>
        </thead>
        <tbody>
          {userSuppliers.map((supplier, index) => (
            <tr key={index}>
              <td>{supplier.name}</td>
              <td>{supplier.email}</td>
              <td>{supplier.role}</td>
              <td>{supplier.branch}</td>
            </tr>
          ))}
        </tbody>
      </ScrollableTable>

      {/* Add Invite User button */}
      <Button onClick={() => openModal('inviteUser')}>Invite User</Button>

      <Modal open={openModal === 'inviteUser'} onClose={closeModal}>
        {/* Modal content for supplier management */}
        <div>
          <h2>Invite User</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = e.target.elements.email.value;
            const role = e.target.elements.role.value;
            const branch = e.target.elements.branch.value;
            // Handle form submission logic here
          }}>
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
            <br />
            <label htmlFor="role">Role:</label>
            <input type="text" id="role" name="role" required />
            <br />
            <label htmlFor="branch">Branch:</label>
            <input type="text" id="branch" name="branch" required />
            <br />
            <button type="submit">Invite</button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default MySuppliersPanel;