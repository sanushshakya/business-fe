// src/store/branchFormSlice.js

import { createSlice } from '@reduxjs/toolkit';

/**
 * Slice for managing the state of the branch form.
 *
 * @constant
 */
const branchFormSlice = createSlice({
  name: 'branchForm',
  initialState: {
    formData: {},
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    errorMessage: '',
  },
  reducers: {
    /**
     * Action to reset the form state.
     *
     * @param {Object} state - The current state of the branch form.
     */
    resetForm(state) {
      state.formData = {};
      state.isSubmitting = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = '';
    },

    /**
     * Action to update form data.
     *
     * @param {Object} state - The current state of the branch form.
     * @param {Object} action - The action object containing the payload with new form data.
     */
    updateFormData(state, action) {
      state.formData = {
        ...state.formData,
        ...action.payload,
      };
    },

    /**
     * Action to start submitting the form.
     *
     * @param {Object} state - The current state of the branch form.
     */
    submitForm(state) {
      state.isSubmitting = true;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = '';
    },

    /**
     * Action to handle successful form submission.
     *
     * @param {Object} state - The current state of the branch form.
     */
    submitFormSuccess(state) {
      state.isSubmitting = false;
      state.isSuccess = true;
    },

    /**
     * Action to handle form submission failure.
     *
     * @param {Object} state - The current state of the branch form.
     * @param {Object} action - The action object containing the payload with error message.
     */
    submitFormFailure(state, action) {
      state.isSubmitting = false;
      state.isError = true;
      state.errorMessage = action.payload;
    },
  },
});

// Export actions
export const {
  resetForm,
  updateFormData,
  submitForm,
  submitFormSuccess,
  submitFormFailure,
} = branchFormSlice.actions;

// Export reducer
export default branchFormSlice.reducer;