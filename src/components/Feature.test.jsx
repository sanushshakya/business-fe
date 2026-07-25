// src/components/Feature.test.jsx

import React from 'react';
import { render } from '@testing-library/react';
import Feature from './Feature';

describe('Feature Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<Feature />);
    expect(getByText(/Welcome to the Feature!/i)).toBeInTheDocument();
  });

  it('renders with custom title prop', () => {
    const { getByText } = render(<Feature title="Custom Title" />);
    expect(getByText(/Custom Title/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const tree = render(<Feature />).asFragment();
    expect(tree).toMatchSnapshot();
  });
});