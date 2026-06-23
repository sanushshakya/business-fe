import React from 'react';
import MainLayout from './components/MainLayout'; // Import the new MainLayout component
import axiosInstance from './api/axiosInstance'; // Import the exported Axios instance

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

  /**
   * Render the application's UI.
   */
  return (
    <MainLayout> {/* Use the MainLayout component */}
      {error ? (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-red-500 font-bold">Oops! Something went wrong.</h1>
          <p className="mt-4">{error}</p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          {/* Main content of the application */}
          <h1 className="text-2xl font-bold">Welcome to the iq-fe App</h1>
          <p className="mt-4">This is a React application built with Vite.</p>
        </div>
      )}
    </MainLayout>
  );
};

export default App;