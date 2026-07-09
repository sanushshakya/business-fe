import React from 'react';
import { Button, Input } from 'shadcn/ui';

/**
 * UpdateProductView component to allow updating product details via a form.
 *
 * @returns {React.FC} - The UpdateProductView component
 */
const UpdateProductView: React.FC = () => {
  const [productName, setProductName] = React.useState('');
  const [productCategory, setProductCategory] = React.useState('');
  const [reorderThreshold, setReorderThreshold] = React.useState('');

  /**
   * Handles the form submission to update product details.
   *
   * @param {React.FormEvent} event - The form submission event
   */
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Logic to send PATCH request to update product details
    console.log('Updating product:', productName, productCategory, reorderThreshold);
  };

  return (
    <div>
      <h1>Update Product Details</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="productName">Product Name:</label>
        <Input type="text" id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} />

        <label htmlFor="productCategory">Category:</label>
        <Input type="text" id="productCategory" value={productCategory} onChange={(e) => setProductCategory(e.target.value)} />

        <label htmlFor="reorderThreshold">Reorder Threshold:</label>
        <Input type="number" id="reorderThreshold" value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} />

        <Button type="submit">Update Product</Button>
      </form>
    </div>
  );
};

export default UpdateProductView;