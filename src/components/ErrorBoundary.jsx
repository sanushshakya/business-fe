// src/components/ErrorBoundary.jsx

import React, { Component } from 'react';
import ErrorLogFormatter from '../utils/ErrorLogFormatter';

/**
 * Catches render errors in its subtree and shows a fallback message instead of a blank page.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(ErrorLogFormatter.format(error), errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <h1 role="alert">Something went wrong. Please try reloading the page.</h1>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
