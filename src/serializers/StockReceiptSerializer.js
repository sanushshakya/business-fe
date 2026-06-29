/**
 * Serializer for the Stock Receipt model to handle data transformations and validations.
 */

// Import necessary utilities and models
import { validateStockReceipt } from '../utils/validations';
import { transformForRxDB } from '../utils/transformers';

/**
 * Serializer class for handling Stock Receipts.
 */
export default class StockReceiptSerializer {
  /**
   * Constructor for the StockReceiptSerializer.
   * @param {Object} data - The initial data to be serialized.
   */
  constructor(data = {}) {
    this.data = data;
    this.errors = {};
  }

  /**
   * Validates the current data against the schema.
   * @returns {boolean} True if valid, false otherwise.
   */
  validate() {
    const result = validateStockReceipt(this.data);
    if (!result.valid) {
      this.errors = result.errors;
      return false;
    }
    return true;
  }

  /**
   * Transforms the data into a format suitable for RxDB storage.
   * @returns {Object} The transformed data.
   */
  transformForRxDB() {
    if (!this.validate()) {
      throw new Error('Data is invalid');
    }
    return transformForRxDB(this.data);
  }

  /**
   * Gets the current data.
   * @returns {Object} The current data.
   */
  getData() {
    return this.data;
  }

  /**
   * Sets new data and resets errors.
   * @param {Object} newData - New data to be set.
   */
  setData(newData) {
    this.data = newData;
    this.errors = {};
  }
}