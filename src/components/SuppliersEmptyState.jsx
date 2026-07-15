import React from 'react';
import { IoIosSad } from 'react-icons/io';

// Component for displaying an empty state for suppliers list
const SuppliersEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <IoIosSad size={64} color="#9EA0A5" />
      <h2 className="mt-4 text-lg font-medium">No suppliers found</h2>
      <p className="mt-2 text-sm text-gray-500">Start by adding your first supplier.</p>
      <button className="mt-4 px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded hover:bg-blue-600">
        Add Supplier
      </button>
    </div>
  );
};

export default SuppliersEmptyState;