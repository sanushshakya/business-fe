import React from 'react';
import EmptyStateComponent from '../components/EmptyStateComponent'; // Import the empty state component
import InventoryList from '../components/InventoryList'; // Import the inventory list component
import useInventory from '../hooks/useInventory'; // Import the custom hook to fetch inventory data

/**
 * @module src/pages/InventoryListPage.jsx
 * @description The Inventory List Page component.
 */
const InventoryListPage = () => {
  const { products, isLoading, isError } = useInventory(); // Fetch inventory data using the custom hook

  /**
   * @function renderContent
   * @description Renders the content based on the availability of inventory items.
   * @returns {JSX.Element} - The JSX element representing the rendered content.
   */
  const renderContent = () => {
    if (isLoading) return <p>Loading...</p>; // Display loading message if data is being fetched
    if (isError) return <p>Error fetching inventory.</p>; // Display error message if fetching fails
    if (!products || products.length === 0) return <EmptyStateComponent />; // Render empty state component if no products are found

    return <InventoryList products={products} />; // Render the inventory list component with fetched data
  };

  return (
    <div>
      <h1>Inventory List</h1>
      {renderContent()} {/* Call the renderContent function to determine what to display */}
    </div>
  );
};

export default InventoryListPage;