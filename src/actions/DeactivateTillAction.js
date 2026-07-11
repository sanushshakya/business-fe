// src/actions/DeactivateTillAction.js

/**
 * Action to deactivate a Till.
 *
 * @param {number} tillId - The ID of the Till to be deactivated.
 * @returns {Object} - An action object with type 'DEACTIVATE_TILL' and payload containing the Till ID.
 */
export const deactivateTill = (tillId) => {
  return {
    type: 'DEACTIVATE_TILL',
    payload: { tillId },
  };
};