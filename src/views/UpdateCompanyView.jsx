import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * UpdateCompanyView component to display and update company details.
 *
 * @returns {React.FC} - The UpdateCompanyView component
 */
const UpdateCompanyView = () => {
  const [company, setCompany] = useState({
    name: '',
    address: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch company details when the component mounts
    fetchCompanyDetails();
  }, []);

  /**
   * Function to fetch company details from the API.
   */
  const fetchCompanyDetails = async () => {
    try {
      const response = await axios.get('/api/company/details');
      setCompany(response.data);
    } catch (error) {
      console.error('Error fetching company details:', error);
      toast.error('Failed to load company details.');
    }
  };

  /**
   * Function to handle changes in the input fields.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event
   */
  const handleChange = (event) => {
    setCompany({
      ...company,
      [event.target.name]: event.target.value
    });
  };

  /**
   * Function to update company details using the PATCH API.
   */
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.patch('/api/company/update', company);
      toast.success('Company details updated successfully.');
    } catch (error) {
      console.error('Error updating company details:', error);
      toast.error('Failed to update company details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Update Company Details</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={company.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={company.address}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={company.phone}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </button>
      </form>
    </div>
  );
};

export default UpdateCompanyView;