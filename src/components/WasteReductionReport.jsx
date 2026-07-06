import React from 'react';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar } from 'recharts';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import useNetworkStatus from '../hooks/useNetworkStatus';

/**
 * WasteReductionReport component to display the Waste Reduction Report page.
 *
 * @returns {React.FC} - The WasteReductionReport component
 */
const WasteReductionReport: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches the waste reduction report data from the API.
   *
   * @returns {Promise<void>} - A promise that resolves when the data is fetched.
   */
  const fetchReportData = async () => {
    try {
      if (!isOnline) {
        throw new Error('No internet connection');
      }

      const response = await fetch('/api/reports/waste-reduction/');
      if (!response.ok) {
        throw new Error(`Failed to fetch waste reduction report: ${response.statusText}`);
      }
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching waste reduction report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOnline) {
      fetchReportData();
    }
  }, [isOnline]);

  /**
   * Handles the rendering of the waste reduction report based on network status and data availability.
   *
   * @returns {JSX.Element} - JSX element representing the rendered content.
   */
  const renderContent = () => {
    if (!isOnline) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6">Offline Mode</Typography>
            <Typography>Please check your internet connection to view the waste reduction report.</Typography>
          </CardContent>
        </Card>
      );
    }

    if (isLoading) {
      return (
        <Card>
          <CardContent>
            <CircularProgress />
          </CardContent>
        </Card>
      );
    }

    if (!reportData) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6">No Data Available</Typography>
            <Typography>There is no data available to display for the waste reduction report.</Typography>
          </CardContent>
        </Card>
      );
    }

    const filteredData = reportData.priceChangeLogs.filter(log => 
      log.reason === 'decay_markdown' &&
      new Date() - new Date(log.date) <= 30 * 24 * 60 * 60 * 1000 // last 30 days
    );

    const totalStockValueSaved = filteredData.reduce((total, log) => total + (log.value || 0), 0);

    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Waste Reduction Report</Typography>
          <Typography>Total Stock Value Saved from Markdowns: ${totalStockValueSaved.toFixed(2)}</Typography>
          <BarChart width={500} height={300} data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar name="Markdown Value" dataKey="value" fill="#8884d8" />
          </BarChart>
        </CardContent>
      </Card>
    );
  };

  return renderContent();
};

export default WasteReductionReport;