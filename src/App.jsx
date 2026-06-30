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

/**
 * The main App component that serves as the entry point of the application.
 * It renders the application's UI and includes basic error handling to improve user experience.
 */
const App = () => {
  // State to hold any errors that occur during rendering or fetching data
  const [error, setError] = React.useState(null);

  /**
   * useEffect hook to handle any errors thrown during the component's lifecycle.
   */
  React.useEffect(() => {
    const handleError = (err) => {
      console.error('Error:', err);
      setError(err.message);
    };

    // Adding global error handlers
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  /**
   * Example function to demonstrate using the exported Axios instance for API calls.
   */
  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/api/data');
      console.log(response.data);
    } catch (error) {
      setError(error.message);
    }
  };

  // Call the fetchData function when the component mounts
  React.useEffect(() => {
    fetchData();
  }, []);

  // Use the useNetworkStatus hook to update network status in the Zustand store
  const isOnline = useNetworkStatus((state) => state.isOnline);
  React.useEffect(() => {
    setNetworkStatus(isOnline);
  }, [isOnline, setNetworkStatus]);

  // Use the useSyncManager hook to trigger actions when the network status changes from offline to online
  useSyncManager();

  /**
   * Register the Service Worker using Workbox.
   */
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
      });
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LoginForm />} />
          <Route path="/demand-alerts" element={<PrivateRoute component={DemandAlertsPage} />} />
          <Route path="/stock-alerts" element={<PrivateRoute component={StockAlertsPage} />} />
          <Route path="/price-changes" element={<PrivateRoute component={FeatureComponent} />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;