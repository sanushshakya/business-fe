/**
 * Main Layout Component
 * This component serves as the main layout for the application,
 * featuring a left sidebar and a top bar with tabs for Demand and Stock Alerts.
 */
import React from 'react';
import Sidebar from './Sidebar'; // Import the Sidebar component
import TopBar from './TopBar'; // Import the TopBar component
import ConnectivityBadge from './ConnectivityBadge'; // Import the ConnectivityBadge component
import { Container } from '@shadcn/ui/dist/components/ui/container';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';

/**
 * MainLayout Component
 * @param {Object} props - The component props.
 * @returns {JSX.Element} - The rendered JSX element.
 */
const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <Sidebar>
        {/* Placeholder navigation links */}
        <a href="#" className="block px-4 py-2 hover:bg-gray-100">Home</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-100">About</a>
        <a href="#" className="block px-4 py-2 hover:bg-gray-100">Contact</a>
        {/* Add Inventory link */}
        <a href="/inventory" className="block px-4 py-2 hover:bg-gray-100">Inventory</a>
      </Sidebar>

      {/* Main Content with a top bar and container for the main content */}
      <Container className="flex flex-col flex-1 w-full">
        <TopBar /> {/* Top Bar Component */}
        <ConnectivityBadge /> {/* Add ConnectivityBadge to the top bar */}
        <Tabs isFitted variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Demand Alerts</Tab>
            <Tab>Stock Alerts</Tab>
          </TabList>
          <TabPanels>
            {children[0]} {/* Render the first child for Demand Alerts */}
            {children[1]} {/* Render the second child for Stock Alerts */}
          </TabPanels>
        </Tabs>
      </Container>
    </div>
  );
};

export default MainLayout;