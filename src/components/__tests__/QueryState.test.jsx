import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import QueryState from '../QueryState';

const renderState = (query, props) =>
  render(
    <QueryState query={query} {...props}>
      {(items) => <p>{items.length} items</p>}
    </QueryState>
  );

describe('QueryState', () => {
  it('shows a busy skeleton while loading', () => {
    const { container } = renderState({ isLoading: true });
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('distinguishes a permission error from other errors', () => {
    const { unmount } = renderState({ isError: true, error: { response: { status: 403 } } });
    expect(screen.getByRole('alert')).toHaveTextContent("You don't have permission");
    unmount();
    renderState({ isError: true, error: new Error('boom') });
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load data');
  });

  it('shows the empty message, or a custom empty node', () => {
    const { unmount } = renderState({ data: [] }, { emptyMessage: 'Nothing here.' });
    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    unmount();
    renderState({ data: [] }, { empty: <p>Custom empty</p> });
    expect(screen.getByText('Custom empty')).toBeInTheDocument();
  });

  it('renders children with the data', () => {
    renderState({ data: [1, 2] });
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });
});
