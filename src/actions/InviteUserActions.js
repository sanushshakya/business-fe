/**
 * src/actions/InviteUserActions.js
 *
 * Handles the Invite User form submission action.
 */

import { createAction } from '@reduxjs/toolkit';

/**
 * Action creator for inviting a user.
 *
 * @param {Object} payload - The payload containing user details.
 * @param {string} payload.email - The email address of the user to invite.
 * @param {string} payload.role - The role of the user being invited.
 * @param {string} payload.branch - The branch to which the user is being invited.
 * @returns {Object} An action object with type and payload.
 */
const InviteUserAction = createAction('inviteUser/submit', (payload) => {
  return {
    payload,
  };
});

export default InviteUserAction;