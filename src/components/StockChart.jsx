import React from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';

/**
 * Stock level over time with an optional reorder-threshold line.
 *
 * @param {{name: string, value: number}[]} data
 * @param {number} [reorderThreshold]
 */
const StockChart = ({ data = [], reorderThreshold, width = 600, height = 300 }) => (
  <AreaChart width={width} height={height} data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Area type="monotone" dataKey="value" stroke="#1e40af" fill="#60a5fa" />
    {reorderThreshold != null && (
      <ReferenceLine y={reorderThreshold} stroke="red" strokeDasharray="5 5" label={`Reorder at ${reorderThreshold}`} />
    )}
  </AreaChart>
);

export default StockChart;
