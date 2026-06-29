// src/components/StockReceiptModal.jsx

import React from 'react';
import { useForm } from 'react-hook-form';
import useAddStockReceipt from '@/hooks/useAddStockReceipt';

/**
 * StockReceiptModal component for creating and submitting stock receipts.
 */
const StockReceiptModal = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Mutation to handle the submission of the stock receipt
  const { mutate, isLoading } = useAddStockReceipt({
    onSuccess: () => {
      onClose();
    },
  });

  // Handler for form submission
  const onSubmit = (data) => {
    mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create Stock Receipt</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="product" className="block text-sm font-medium text-gray-700">
              Product
            </label>
            <input
              id="product"
              type="text"
              {...register('product', { required: 'Product is required' })}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.product && <p className="text-red-500 text-xs mt-1">{errors.product.message}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700">
              Batch Number
            </label>
            <input
              id="batchNumber"
              type="text"
              {...register('batchNumber', { required: 'Batch Number is required' })}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.batchNumber && <p className="text-red-500 text-xs mt-1">{errors.batchNumber.message}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              {...register('quantity', { required: 'Quantity is required', min: 1 })}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>
          <div className="mb-4">
            <label htmlFor="unitCost" className="block text-sm font-medium text-gray-700">
              Unit Cost
            </label>
            <input
              id="unitCost"
              type="number"
              {...register('unitCost', { required: 'Unit Cost is required' })}
              className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.unitCost && <p className="text-red-500 text-xs mt-1">{errors.unitCost.message}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 focus:outline-none"
            disabled={isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StockReceiptModal;