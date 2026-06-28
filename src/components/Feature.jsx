// src/components/Feature.jsx

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';

/**
 * Feature component for displaying Price Changes in a table.
 *
 * @component
 * @returns {JSX.Element} - The rendered Feature component.
 */
const Feature = () => {
  // Example data structure for the price changes table
  const priceChangesData = [
    {
      productName: 'Product A',
      oldPrice: '£10.00',
      newPrice: '£9.50',
      changePercent: '-5%',
      reason: 'Invoice Update',
      triggeredAt: '2023-04-01T12:00:00Z',
      status: 'Approved',
    },
    {
      productName: 'Product B',
      oldPrice: '£20.00',
      newPrice: '£25.00',
      changePercent: '+25%',
      reason: 'Manual',
      triggeredAt: '2023-04-02T14:00:00Z',
      status: 'Pending Approval',
    },
  ];

  return (
    <div>
      <h1>Price Changes</h1>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product Name</TableCell>
            <TableCell>Old Price (£)</TableCell>
            <TableCell>New Price (£)</TableCell>
            <TableCell>Change %</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Triggered At</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {priceChangesData.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.productName}</TableCell>
              <TableCell>{item.oldPrice}</TableCell>
              <TableCell>{item.newPrice}</TableCell>
              <TableCell>{item.changePercent}</TableCell>
              <TableCell>{item.reason}</TableCell>
              <TableCell>{item.triggeredAt}</TableCell>
              <TableCell>{item.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Feature;