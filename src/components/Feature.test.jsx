// src/components/Feature.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import Feature from './Feature';

describe('Feature Component', () => {
  const mockData = [
    {
      productName: 'Product A',
      oldPrice: 100,
      newPrice: 90,
      changePercent: -10,
      reason: 'Invoice Update',
      triggeredAt: new Date().toISOString(),
      status: 'Pending Approval'
    },
    {
      productName: 'Product B',
      oldPrice: 200,
      newPrice: 250,
      changePercent: 25,
      reason: 'Manual',
      triggeredAt: new Date().toISOString(),
      status: 'Approved'
    }
  ];

  test('renders Feature component with data', () => {
    render(<Feature data={mockData} requireApproval />);
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('-10%')).toBeInTheDocument();
    expect(screen.getByText('Invoice Update')).toBeInTheDocument();
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });

  test('renders Approve and Reject buttons only in requireApproval mode', () => {
    render(<Feature data={mockData} requireApproval />);
    expect(screen.queryByText('Approve')).toBeInTheDocument();
    expect(screen.queryByText('Reject')).toBeInTheDocument();

    render(<Feature data={mockData} />);
    expect(screen.queryByText('Approve')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject')).not.toBeInTheDocument();
  });

  test('handles Approve button click', () => {
    const handleApprove = jest.fn();
    render(<Feature data={mockData} requireApproval onApprove={handleApprove} />);
    fireEvent.click(screen.getByText('Approve'));
    expect(handleApprove).toHaveBeenCalledWith(mockData[0]);
  });

  test('handles Reject button click', () => {
    const handleReject = jest.fn();
    render(<Feature data={mockData} requireApproval onReject={handleReject} />);
    fireEvent.click(screen.getByText('Reject'));
    expect(handleReject).toHaveBeenCalledWith(mockData[0]);
  });
});