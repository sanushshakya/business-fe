// src/components/ErrorBoundary.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  // Test to check if the ErrorBoundary catches and renders error message when a component throws an error
  it('catches and displays error message when child component throws an error', async () => {
    const throwError = () => { throw new Error('Test error'); };
    
    render(
      <ErrorBoundary>
        <div>{throwError()}</div>
      </ErrorBoundary>
    );

    // Wait for the error message to be displayed
    await waitFor(() => screen.getByText('Something went wrong. Please try reloading the page.'));
  });

  // Test to check if the ErrorBoundary renders children when no errors occur
  it('renders children when no errors occur', () => {
    render(
      <ErrorBoundary>
        <div>No error here!</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('No error here!')).toBeInTheDocument();
  });
});