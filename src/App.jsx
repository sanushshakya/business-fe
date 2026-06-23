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
    <div className="App">
      {error ? (
        <div>
          <h1>Oops! Something went wrong.</h1>
          <p>{error}</p>
        </div>
      ) : (
        <div>
          {/* Main content of the application */}
          <h1>Welcome to the iq-fe App</h1>
          <p>This is a React application built with Vite.</p>
        </div>
      )}
    </div>
  );
};

export default App;