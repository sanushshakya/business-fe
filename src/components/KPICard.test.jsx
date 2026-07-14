// src/components/KPICard.test.jsx

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KPICard from './KPICard';

describe('KPICard Component', () => {
  const mockData = {
    title: 'Total Sales',
    value: '$5000.00',
    icon: 'sales-icon',
  };

  test('renders KPI card with correct title, value, and icon', () => {
    render(<KPICard data={mockData} />);
    expect(screen.getByText(mockData.title)).toBeInTheDocument();
    expect(screen.getByText(mockData.value)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: mockData.icon })).toBeInTheDocument();
  });

  test('calls onClick handler when card is clicked', () => {
    const handleClick = jest.fn();
    render(<KPICard data={mockData} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});