import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import necessary components for routing
import MainLayout from './components/MainLayout'; // Import the new MainLayout component
import LoginForm from './components/LoginForm'; // Import the LoginForm component
import axiosInstance from './api/axiosInstance'; // Import the exported Axios instance
import { useAuthStore, setNetworkStatus } from '../stores/authStore'; // Import Zustand store for managing authentication state
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute wrapper
import DemandAlertsPage from './views/DemandAlertsPage'; // Import the Demand Alerts page component
import StockAlertsPage from './views/StockAlertsPage'; // Import the Stock Alerts page component
import FeatureComponent from './views/FeatureComponent'; // Import the new Price Changes feature component
import offlineDB from './offlineDB'; // Import offlineDB.js to use RxDB for offline database
import useNetworkStatus from '../hooks/useInventory'; // Import the useNetworkStatus hook
import useSyncManager from '../hooks/useSyncManager'; // Import the useSyncManager hook
import FreightAlertsPanel from './components/FreightAlertsPanel'; // Import FreightAlertsPanel component
import SupplierCarousel from './components/SupplierCarousel'; // Import SupplierCarousel component

/**
 * The main App component that serves as the entry point of the application.
 * It renders the application's UI and includes basic error handling to improve user experience.
 */
const App = () => {
  const [error, setError] = React.useState(null);

  /**
   * useEffect hook to handle any errors thrown during the component's lifecycle.
   */
  React.useEffect(() => {
    const handleError = (err) => {
      console.error('Error:', err);
      setError(err.message);
    };

    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/api/data');
      console.log(response.data);
    } catch (error) {
      setError(error.message);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const isOnline = useNetworkStatus((state) => state.isOnline);
  React.useEffect(() => {
    setNetworkStatus(isOnline);
  }, [isOnline, setNetworkStatus]);

  useSyncManager();

  // Establish WebSocket connection
  React.useEffect(() => {
    const socket = new WebSocket('ws://example.com/socket');

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
      // Handle incoming data as needed
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <MainLayout>
              <FeatureComponent /> {/* Add the new Feature component */}
              <DemandAlertsPage />
              <StockAlertsPage />
              <FreightAlertsPanel />
              <SupplierCarousel />
            </MainLayout>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
};

export default App;