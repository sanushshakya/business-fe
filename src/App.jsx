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

  /**
   * Render the application's UI.
   */
  return (
    <Router> {/* Use BrowserRouter for routing */}
      <MainLayout> {/* Use the MainLayout component */}
        {error ? (
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <h1 className="text-red-500 font-bold">Oops! Something went wrong.</h1>
            <p className="mt-4">{error}</p>
          </div>
        ) : (
          <>
            {/* Use PrivateRoute for protected routes */}
            <PrivateRoute path="/dashboard" element={<Dashboard />} />
            <PrivateRoute path="/profile" element={<Profile />} />
            {/* Routes for Demand and Stock Alerts pages */}
            <Routes>
              <Route path="/demand-alerts" element={<DemandAlertsPage />} />
              <Route path="/stock-alerts" element={<StockAlertsPage />} />
              {/* Add route for the Price Changes feature component */}
              <Route path="/price-changes" element={<FeatureComponent />} />
            </Routes>
          </>
        )}
      </MainLayout>
    </Router>
  );
};

export default App;