import React from 'react';

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
   * Render the application's UI.
   */
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
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
    </div>
  );
};

export default App;