import React from 'react';
import { Table, Modal, Button } from 'shadcn/ui';
import { useSelector } from 'react-redux';
import useSyncManager from '../hooks/useSyncManager';

/**
 * Feature component to display pending invitations in a separate table with actions.
 *
 * @returns {React.FC} - The Feature component
 */
const Feature: React.FC = () => {
  const invites = useSelector((state) => state.invites.pending);
  const { openModal, closeModal } = useSyncManager();

  /**
   * Handles the resend action for an invitation.
   *
   * @param {string} inviteId - The ID of the invitation to resend.
   */
  const handleResend = (inviteId) => {
    if (!inviteId) {
      openModal('Error', 'Invalid invitation ID');
      return;
    }

    openModal('Resending...');
    // Logic to resend the invitation
    // Simulate sending logic
    setTimeout(() => {
      closeModal();
    }, 1000);
  };

  /**
   * Handles the cancel action for an invitation.
   *
   * @param {string} inviteId - The ID of the invitation to cancel.
   */
  const handleCancel = (inviteId) => {
    if (!inviteId) {
      openModal('Error', 'Invalid invitation ID');
      return;
    }

    openModal('Cancelling...');
    // Logic to cancel the invitation
    // Simulate cancellation logic
    setTimeout(() => {
      closeModal();
    }, 1000);
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Pending Invitations</h2>
      {invites.length > 0 ? (
        <Table className="sm:table-auto md:table-auto w-full">
          <thead className="bg-gray-100">
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id} className="hover:bg-gray-200">
                <td>{invite.email}</td>
                <td>{invite.role}</td>
                <td className="flex space-x-4">
                  <Button onClick={() => handleResend(invite.id)}>Resend</Button>
                  <Button onClick={() => handleCancel(invite.id)}>Cancel</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-gray-500">No pending invitations.</p>
      )}
    </div>
  );
};

export default Feature;