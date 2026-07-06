import React, { useEffect, useState } from 'react';
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

    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Waste Reduction Report</Typography>
          {/* Render the actual content of the waste reduction report here */}
          <Typography>{reportData.summary}</Typography>
        </CardContent>
      </Card>
    );
  };

  return renderContent();
};

export default WasteReductionReport;