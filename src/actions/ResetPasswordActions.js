// src/actions/ResetPasswordActions.js

/**
 * Actions related to password reset functionality.
 *
 * @module src/actions/ResetPasswordActions
 */

import { RESET_PASSWORD_REQUEST, RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAILURE } from '../constants';
import axios from '../../utils/axios';

/**
 * Action creator for requesting password reset.
 *
 * @function requestResetPassword
 * @param {string} email - The user's email address.
 * @returns {Object} An action object with type and payload.
 */
export const requestResetPassword = (email) => {
  return {
    type: RESET_PASSWORD_REQUEST,
    payload: email
  };
};

/**
 * Action creator for handling successful password reset.
 *
 * @function handleResetSuccess
 * @param {string} message - Success message from the API.
 * @returns {Object} An action object with type and payload.
 */
export const handleResetSuccess = (message) => {
  return {
    type: RESET_PASSWORD_SUCCESS,
    payload: message
  };
};

/**
 * Action creator for handling password reset failure.
 *
 * @function handleResetFailure
 * @param {Error} error - The error encountered during the password reset process.
 * @returns {Object} An action object with type and payload.
 */
export const handleResetFailure = (error) => {
  return {
    type: RESET_PASSWORD_FAILURE,
    payload: error.message || 'Password reset failed'
  };
};

/**
 * Thunk action for performing the actual password reset.
 *
 * @function resetPassword
 * @param {string} token - The reset token received in the email.
 * @param {string} newPassword - The new password to set.
 * @returns {Function} A thunk function that performs the async operation and dispatches appropriate actions.
 */
export const resetPassword = (token, newPassword) => {
  return async (dispatch) => {
    try {
      dispatch(requestResetPassword());
      const response = await axios.post('/api/reset-password', { token, newPassword });
      dispatch(handleResetSuccess(response.data.message));
      // Redirect to login after successful password reset
      window.location.href = '/login';
    } catch (error) {
      dispatch(handleResetFailure(error));
    }
  };
};