import React from 'react';
import AreaChart from 'recharts/lib/cartesian/AreaChart';
import XAxis from 'recharts/lib/cartesian/XAxis';
import YAxis from 'recharts/lib/cartesian/YAxis';
import CartesianGrid from 'recharts/lib/cartesian/CartesianGrid';
import Tooltip from 'recharts/lib/component/Tooltip';
import Legend from 'recharts/lib/component/Legend';

/**
 * StockChart component to display a Recharts AreaChart of stock value over the last 30 days.
 *
 * @returns {React.FC} - The StockChart component
 */
const StockChart = () => {
  const data = [
    { name: 'Day 1', value: 50 },
    { name: 'Day 2', value: 60 },
    // ... Add more data points for the last 30 days
  ];

  return (
    <AreaChart width={700} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="#8884d8" />
    </AreaChart>
  );
};

export default StockChart;