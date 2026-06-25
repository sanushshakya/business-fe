import React from 'react';

/**
 * FormFields component to encapsulate the form fields within StockReceiptModal.
 * This component will handle the display and management of individual form fields.
 *
 * @component
 */
const FormFields = () => {
  return (
    <div className="flex flex-col space-y-4">
      {/* Example of a single form field */}
      <label htmlFor="item">Item</label>
      <input type="text" id="item" name="item" className="border p-2" />

      {/* Example of another form field */}
      <label htmlFor="quantity">Quantity</label>
      <input type="number" id="quantity" name="quantity" className="border p-2" />

      {/* Add more form fields as needed */}
    </div>
  );
};

export default FormFields;