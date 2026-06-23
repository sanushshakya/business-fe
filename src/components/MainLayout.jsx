// src/components/MainLayout.jsx

/**
 * Main Layout Component
 * This component serves as the main layout for the application,
 * featuring a left sidebar and a top bar.
 */
import React from 'react';
import Sidebar from './Sidebar'; // Import the Sidebar component
import TopBar from './TopBar'; // Import the TopBar component
import { Container } from '@shadcn/ui/dist/components/ui/container';

/**
 * MainLayout Component
 * @param {Object} props - The component props.
 * @returns {JSX.Element} - The rendered JSX element.
 */
const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content with a top bar and container for the main content */}
      <Container className="flex flex-col flex-1 w-full">
        <TopBar /> {/* Top Bar Component */}
        {children} {/* Render children components */}
      </Container>
    </div>
  );
};

export default MainLayout;