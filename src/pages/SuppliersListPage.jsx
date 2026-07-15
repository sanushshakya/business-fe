import React from 'react';
import EmptyState from '../components/EmptyState'; // Import the new empty state component
import SupplierList from '../components/SupplierList'; // Import the existing supplier list component

/**
 * @module src/pages/SuppliersListPage.jsx
 *
 * @description
 * This module defines the Suppliers List Page component. It uses the EmptyState component to display a message when there are no suppliers.
 */

const SuppliersListPage = ({ suppliers }) => {
  /**
   * @function renderContent
   *
   * @param {Array} suppliers - An array of supplier objects.
   * @returns {JSX.Element}
   *
   * @description
   * This function renders the content based on whether there are suppliers or not.
   */

  const renderContent = () => {
    if (suppliers.length === 0) {
      return <EmptyState title="No Suppliers Found" description="Please add a new supplier to get started." />;
    }
    return <SupplierList suppliers={suppliers} />;
  };

  return (
    <div>
      <h1>Suppliers List</h1>
      {renderContent()}
    </div>
  );
};

export default SuppliersListPage;