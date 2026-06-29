// src/models/StockReceipt.js

/**
 * @module src/models/StockReceipt
 * @description Model for handling stock receipt data and interactions with RxDB.
 */

import { defineRxSchema } from 'rxdb';

/**
 * Schema definition for the Stock Receipt model.
 * This schema will be used to store stock receipts in RxDB.
 *
 * @type {Object}
 */
const stockReceiptSchema = defineRxSchema({
  version: 0,
  type: 'object',
  properties: {
    id: {
      type: 'string',
      primary: true
    },
    receiptNumber: {
      type: 'number',
      minimum: 1
    },
    date: {
      type: 'string',
      format: 'date-time'
    },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          itemId: {
            type: 'string'
          },
          quantity: {
            type: 'number',
            minimum: 1
          },
          pricePerUnit: {
            type: 'number',
            minimum: 0.01
          }
        },
        required: ['itemId', 'quantity', 'pricePerUnit'],
        additionalProperties: false
      }
    },
    totalValue: {
      type: 'number',
      minimum: 0.01,
      readOnly: true
    }
  },
  required: ['receiptNumber', 'date', 'items'],
  additionalProperties: false,
  hooks: {
    preInsert: [async (docData, instance) => {
      // Calculate total value before inserting the document
      docData.totalValue = docData.items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    }]
  }
});

export default stockReceiptSchema;