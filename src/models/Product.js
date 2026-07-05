// src/models/Product.js
/**
 * Product model to represent a product with SKU, name, category, and reorder threshold.
 *
 * @module src/models/Product.js
 */

class Product {
  /**
   * Creates an instance of Product.
   *
   * @param {string} sku - The SKU (Stock Keeping Unit) of the product.
   * @param {string} name - The name of the product.
   * @param {string} category - The category of the product.
   * @param {number} reorderThreshold - The reorder threshold for the product.
   */
  constructor(sku, name, category, reorderThreshold) {
    this.sku = sku;
    this.name = name;
    this.category = category;
    this.reorderThreshold = reorderThreshold;
  }

  /**
   * Validates the product data.
   *
   * @returns {boolean} - True if the product is valid, false otherwise.
   */
  isValid() {
    return (
      typeof this.sku === 'string' &&
      typeof this.name === 'string' &&
      typeof this.category === 'string' &&
      typeof this.reorderThreshold === 'number'
    );
  }

  /**
   * Converts the Product instance to a JSON object.
   *
   * @returns {Object} - The JSON representation of the product.
   */
  toJSON() {
    return {
      sku: this.sku,
      name: this.name,
      category: this.category,
      reorderThreshold: this.reorderThreshold,
    };
  }
}

export default Product;