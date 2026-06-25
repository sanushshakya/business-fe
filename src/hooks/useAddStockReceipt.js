import { useMutation } from 'react-query';
import { axiosInstance } from '../utils/axios';

/**
 * Custom hook to handle adding stock receipts via react-query.
 *
 * @returns {Object} An object containing the mutation's status and functions.
 */
export const useAddStockReceipt = () => {
  /**
   * Mutates the stock receipt data by sending a POST request to the backend.
   *
   * @param {Object} receiptData - The stock receipt data to be added.
   * @returns {Promise<Object>} A promise that resolves with the response from the backend.
   */
  const addStockReceipt = async (receiptData) => {
    const response = await axiosInstance.post('/api/receipts', receiptData);
    return response.data;
  };

  // Create a mutation using react-query
  const { mutate, isLoading, isError, error, isSuccess, data } = useMutation(
    'addStockReceipt',
    addStockReceipt,
    {
      onSuccess: (data) => {
        console.log('Stock receipt added successfully:', data);
      },
      onError: (error) => {
        console.error('Failed to add stock receipt:', error);
      }
    }
  );

  return { mutate, isLoading, isError, error, isSuccess, data };
};