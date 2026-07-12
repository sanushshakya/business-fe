// src/components/UserTable.jsx

import React from 'react';
import Table from 'shadcn/ui/table';

/**
 * UserTable component to display user data with specified columns in a table.
 *
 * @param {Object} props - The props object.
 * @param {Array<Object>} props.users - An array of user objects to be displayed in the table.
 * @returns {React.FC} - The UserTable component
 */
const UserTable = ({ users }) => {
  // Define column headers and corresponding data accessor functions
  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Role Badge',
      accessorKey: 'role',
      cell: ({ row }) => (
        <span className={`badge badge-${row.original.role}`}>
          {row.original.role}
        </span>
      ),
    },
    {
      header: 'Branch Assignment',
      accessorKey: 'branchAssignment',
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin',
      cell: ({ row }) => (
        <time dateTime={row.original.lastLogin}>
          {new Date(row.original.lastLogin).toLocaleString()}
        </time>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        // Determine the status of the user
        const status = row.original.isActive ? 'active' : 'pending invite';
        return (
          <span className={`badge badge-${status}`}>
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <Table data={users} columns={columns}>
      {/* Table components from shadcn/ui or custom implementations */}
    </Table>
  );
};

export default UserTable;