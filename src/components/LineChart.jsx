import React from 'react';
import { LineChart, XAxis, YAxis, CartesianGrid, Line, ReferenceLine } from 'recharts';

/**
 * @module src/components/LineChart.jsx
 *
 * A component to render a line chart for displaying inventory projections.
 */

const data = [
  // Example data points
  { name: 'Day 1', value: 50 },
  { name: 'Day 2', value: 60 },
  { name: 'Day 3', value: 70 },
  { name: 'Day 4', value: 80 },
  { name: 'Day 5', value: 90 },
  // Add more data points as needed
];

/**
 * @function LineChart
 *
 * Renders a line chart with inventory projections.
 *
 * @param {Object} props - Component props
 * @param {Array<Object>} props.data - Array of data points for the line chart
 * @param {number} props.reorderThreshold - Reorder threshold to display as a dashed red line
 */
const LineChart = ({ data, reorderThreshold }) => {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" />
      <Line type="monotone" dataKey="value" stroke="#8884d8" />
      {reorderThreshold && (
        <ReferenceLine
          x={data.length - 1}
          label={`Reorder at: ${reorderThreshold}`}
          stroke="red"
          strokeDasharray="5 5"
        />
      )}
    </LineChart>
  );
};

export default LineChart;