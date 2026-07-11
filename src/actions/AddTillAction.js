// src/actions/AddTillAction.js

/**
 * Action creator for adding a new Till.
 *
 * @param {Object} payload - The payload containing details of the new Till to be added.
 * @param {string} payload.name - The name of the new Till.
 * @param {string} payload.address - The address of the new Till.
 * @returns {Object} - An action object with type and payload.
 */
export const addTillAction = (payload) => {
  return {
    type: 'ADD_TILL',
    payload,
  };
};