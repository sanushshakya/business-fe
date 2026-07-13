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
    // Logic to resend the invitation
    openModal('Resending...');
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
    // Logic to cancel the invitation
    openModal('Cancelling...');
    // Simulate cancellation logic
    setTimeout(() => {
      closeModal();
    }, 1000);
  };

  return (
    <div>
      <h2>Pending Invitations</h2>
      {invites.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id}>
                <td>{invite.email}</td>
                <td>{invite.role}</td>
                <td>
                  <Button onClick={() => handleResend(invite.id)}>Resend</Button>
                  <Button onClick={() => handleCancel(invite.id)}>Cancel</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p>No pending invitations.</p>
      )}
    </div>
  );
};

export default Feature;