// src/components/ErrorBoundary.jsx

import React, { Component } from 'react';

/**
 * ErrorBoundary component to catch and handle errors globally within the application using a structured format.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    // Initialize state to track if an error has occurred
    this.state = { hasError: false };
  }

  /**
   * Method called when an error is thrown in a descendant component.
   * @param {Object} error - The error object.
   */
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  /**
   * Method called when an error is thrown in a descendant component.
   * Logs the error to a custom formatter for structured logging.
   * @param {Object} error - The error object.
   * @param {Object} errorInfo - Additional information about the error.
   */
  componentDidCatch(error, errorInfo) {
    // Log the error using a custom formatter
    logErrorWithFormat(error, errorInfo);
  }

  /**
   * Render method.
   * @returns {JSX.Element} - The component's JSX markup.
   */
  render() {
    if (this.state.hasError) {
      // Render a fallback UI when an error occurs
      return <h1>Something went wrong. Please try reloading the page.</h1>;
    }

    // Render the children components normally if no errors have occurred
    return this.props.children; 
  }
}

/**
 * Custom function to log errors with a structured format.
 * @param {Object} error - The error object.
 * @param {Object} errorInfo - Additional information about the error.
 */
function logErrorWithFormat(error, errorInfo) {
  const errorLog = {
    timestamp: new Date(),
    error,
    errorInfo,
  };
  
  console.error(JSON.stringify(errorLog, null, 2));
}

export default ErrorBoundary;