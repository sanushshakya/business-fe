// src/serializers/TillSerializer.js

import { Serializer } from 'jsonapi-serializer';
import TillModel from '../models/Till';

/**
 * @class TillSerializer - A serializer for the Till model.
 */
export default class TillSerializer extends Serializer {
  /**
   * @constructor - Initializes a new instance of the TillSerializer class.
   */
  constructor() {
    super(TillModel, {
      id: 'id',
      type: 'tills',
      attributes: [
        'name',
        'isActive',
        'createdAt',
        'updatedAt',
        'last_seen_at' // Include the last_seen_at field
      ],
      links: (document) => ({
        self: `/api/tills/${document.id}`
      }),
      relationships: {
        products: {
          ref: '/products/{id}',
          includeLinks: true
        }
      },
      keyForAttribute: 'snake_case' // Convert attribute names to snake case
    });
  }

  /**
   * Customizes the serialization of the isActive attribute.
   * @param {boolean} value - The current value of the isActive attribute.
   * @returns {string} - The serialized value.
   */
  customizeIsActive(value) {
    return value ? 'active' : 'inactive';
  }
}