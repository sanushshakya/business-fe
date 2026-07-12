// src/components/TeamPage.jsx

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getUserList } from '../actions/syncActions';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { Table, Modal, Button } from 'shadcn/ui';

/**
 * TeamPage component to display the team list with specified columns.
 *
 * @returns {React.FC} - The TeamPage component
 */
const TeamPage: React.FC = () => {
  const dispatch = useDispatch();
  const userList = useSelector(state => state.userList);
  const isNetworkOnline = useNetworkStatus();

  // Check if the current user has the appropriate role to access this page
  const currentUserRole = useSelector(state => state.currentUser.role);
  const hasAccess = ['admin', 'owner'].includes(currentUserRole);

  /**
   * Fetches the user list from the API when the component mounts or network status changes.
   *
   * @async
   */
  React.useEffect(() => {
    if (isNetworkOnline) {
      dispatch(getUserList());
    }
  }, [dispatch, isNetworkOnline]);

  // Placeholder for handling row click to open a modal with user details
  const handleRowClick = (user) => {
    console.log('User clicked:', user);
    Modal.open({
      title: 'User Details',
      content: (
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
          {/* Additional details can be added here */}
        </div>
      ),
    });
  };

  if (!hasAccess) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Branch Assignment</th>
          <th>Last Login</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {userList.map(user => (
          <tr key={user.id} onClick={() => handleRowClick(user)}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td><span className={`badge ${user.role.toLowerCase()}`}>{user.role}</span></td>
            <td>{user.branchAssignment}</td>
            <td>{user.lastLogin}</td>
            <td>{user.status}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TeamPage;