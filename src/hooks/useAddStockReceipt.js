import { useMutation } from 'react-query';
import { axiosInstance } from '../utils/axios';
import { RxDB } from 'rxdb';

// Initialize RxDB database instance (example)
let db = null;

const initializeRxDB = async () => {
  try {
    // Initialize the RxDB database
    db = await RxDB.create({
      name: 'mydatabase',
      adapter: 'idb' // Use IndexedDB as storage engine
    });
    
    // Create a collection for stock receipts (example)
    const receiptCollection = await db.collection('receipts', {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          data: { type: 'object' }
        },
        required: ['id', 'data']
      }
    });
    
    return receiptCollection;
  } catch (error) {
    console.error('Failed to initialize RxDB:', error);
    throw error;
  }
};

/**
 * Custom hook to handle adding stock receipts via react-query.
 *
 * @returns {Object} An object containing the mutation's status and functions.
 */
export const useAddStockReceipt = () => {
  let receiptCollection;

  // Initialize RxDB collection when the component mounts
  if (!receiptCollection) {
    receiptCollection = await initializeRxDB();
  }

  /**
   * Mutates the stock receipt data by writing it to RxDB first before calling the API.
   *
   * @param {Object} receiptData - The stock receipt data to be added.
   * @returns {Promise<Object>} A promise that resolves with the response from the backend.
   */
  const addStockReceipt = async (receiptData) => {
    try {
      // Write the data to RxDB
      await receiptCollection.insert({
        id: receiptData.id,
        data: receiptData
      });

      // Call the API to confirm the data addition
      const response = await axiosInstance.post('/api/receipts', receiptData);
      return response.data;
    } catch (error) {
      console.error('Failed to add stock receipt:', error);
      throw error;
    }
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