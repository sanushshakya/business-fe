import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

/**
 * WasteReductionReport component to display the Waste Reduction Report page with a data table for individual markdown events.
 *
 * @returns {React.FC} - The WasteReductionReport component
 */
const WasteReductionReport: React.FC = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetches the waste reduction report data from the API.
   *
   * @returns {Promise<void>} - A promise that resolves when the data is fetched.
   */
  const fetchReportData = async () => {
    try {
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
    fetchReportData();
  }, []);

  /**
   * Handles the rendering of the waste reduction report based on data availability.
   *
   * @returns {JSX.Element} - JSX element representing the rendered content.
   */
  const renderContent = () => {
    if (isLoading) {
      return (
        <Paper>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell>Loading...</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Loading state */}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      );
    }

    if (!reportData) {
      return (
        <Paper>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>
                  <TableCell>No Data Available</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* No data available */}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      );
    }

    const filteredData = reportData.priceChangeLogs.filter(log => 
      log.reason === 'decay_markdown' &&
      new Date() - new Date(log.date) <= 30 * 24 * 60 * 60 * 1000 // last 30 days
    );

    return (
      <Paper>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Product Name</TableCell>
                <TableCell>Value Saved</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                  <TableCell>{log.productName}</TableCell>
                  <TableCell>${(log.value || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <div>
      {renderContent()}
    </div>
  );
};

export default WasteReductionReport;