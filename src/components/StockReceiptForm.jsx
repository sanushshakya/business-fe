// src/components/StockReceiptForm.jsx
import React from 'react';

/**
 * StockReceiptForm component for managing stock receipts on a 390px iPhone viewport.
 * @component
 */
const StockReceiptForm = () => {
  // State to manage form data
  const [formData, setFormData] = React.useState({
    productName: '',
    quantity: 0,
    receivedDate: new Date().toISOString(),
    notes: ''
  });

  /**
   * Handle input changes and update the form data state.
   * @param {Event} event - The change event from the input field.
   */
  const handleInputChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  /**
   * Handle form submission and process the stock receipt data.
   * @param {Event} event - The submit event from the form.
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    // Process the formData, e.g., send it to an API or validate it
    console.log('Form Data Submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="productName" className="block text-sm font-medium text-gray-700">
          Product Name
        </label>
        <input
          id="productName"
          name="productName"
          type="text"
          value={formData.productName}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          value={formData.quantity}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="receivedDate" className="block text-sm font-medium text-gray-700">
          Received Date
        </label>
        <input
          id="receivedDate"
          name="receivedDate"
          type="date"
          value={formData.receivedDate}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Submit
      </button>
    </form>
  );
};

export default StockReceiptForm;