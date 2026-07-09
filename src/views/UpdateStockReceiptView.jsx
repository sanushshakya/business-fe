import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import useInventory from '../hooks/useInventory';
import useNetworkStatus from '../hooks/useNetworkStatus';

/**
 * UpdateStockReceiptView component to display and update stock receipt details.
 *
 * @returns {React.FC} - The UpdateStockReceiptView component
 */
const UpdateStockReceiptView: React.FC = ({ match }) => {
  const { id } = match.params;
  const { inventoryData, isLoading, error } = useInventory();
  const networkStatus = useNetworkStatus();

  // Initial values for the form based on stock receipt data
  const initialValues = {
    sku: '',
    quantity: 0,
    location: '',
  };

  // Validation schema using Yup
  const validationSchema = Yup.object().shape({
    sku: Yup.string()
      .required('SKU is required'),
    quantity: Yup.number()
      .positive('Quantity must be a positive number')
      .required('Quantity is required'),
    location: Yup.string()
      .required('Location is required'),
  });

  // Function to handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!networkStatus.isConnected) {
        toast.error('No network connection. Please check your internet and try again.');
        return;
      }

      // Update stock receipt logic here
      await updateStockReceipt(id, values);
      toast.success('Stock receipt updated successfully');
      setSubmitting(false);
    } catch (error) {
      toast.error('Failed to update stock receipt');
      console.error(error);
      setSubmitting(false);
    }
  };

  // Function to update stock receipt
  const updateStockReceipt = async (id, values) => {
    // Implement the logic to update stock receipt using an API call or service method
    console.log('Updating stock receipt with id', id, 'and values', values);
    // Example: await api.patch(`/stock-receipts/${id}`, values);
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error loading data</p>}
      {!isLoading && !error && (
        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
          {({ isSubmitting, isValid }) => (
            <Form>
              <div>
                <label htmlFor="sku">SKU:</label>
                <Field name="sku" type="text" />
                <ErrorMessage name="sku" component="div" className="error" />
              </div>
              <div>
                <label htmlFor="quantity">Quantity:</label>
                <Field name="quantity" type="number" />
                <ErrorMessage name="quantity" component="div" className="error" />
              </div>
              <div>
                <label htmlFor="location">Location:</label>
                <Field name="location" type="text" />
                <ErrorMessage name="location" component="div" className="error" />
              </div>
              <button type="submit" disabled={!isValid || isSubmitting}>
                Update Stock Receipt
              </button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default UpdateStockReceiptView;