import React from 'react';
import { useMediaQuery } from 'react-responsive';

/**
 * Sidebar component that collapses into a bottom navigation bar on screens below 768px.
 *
 * @returns {React.FC} - The Sidebar component
 */
const Sidebar: React.FC = () => {
  const isMobile = useMediaQuery({ maxDeviceWidth: 767 });

  return (
    <div className="flex flex-col w-full sm:w-1/3 md:w-1/4 bg-white shadow-lg h-screen overflow-y-auto">
      {isMobile && (
        <nav className="absolute bottom-0 left-0 right-0 bg-gray-800 text-white px-4 py-2">
          <ul>
            <li className="mb-2">
              <a href="#" className="block p-2 hover:bg-gray-700">Home</a>
            </li>
            <li className="mb-2">
              <a href="#" className="block p-2 hover:bg-gray-700">Products</a>
            </li>
            <li className="mb-2">
              <a href="#" className="block p-2 hover:bg-gray-700">Settings</a>
            </li>
          </ul>
        </nav>
      )}
      {!isMobile && (
        <div className="p-4 flex flex-col items-center">
          <h1>Sidebar</h1>
          <ul>
            <li className="mb-2">
              <a href="#" className="block p-2 hover:bg-gray-300">Home</a>
            </li>
            <li className="mb-2">
              <a href="#" className="block p-2 hover:bg-gray-300">Products</a>
            </li>
            <li className="mb-2">
              <a href="#" className="block p-2 hover:bg-gray-300">Settings</a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;