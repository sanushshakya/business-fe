// src/actions/branchFormActions.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import companyService from '../../services/companyService';

/**
 * Creates a new branch for a company.
 *
 * @param {Object} branchData - The data for the new branch.
 * @returns {Promise<Object>} - A promise that resolves to the created branch data.
 */
export const createBranch = createAsyncThunk(
  'company/createBranch',
  async (branchData, thunkAPI) => {
    try {
      const response = await companyService.createBranch(branchData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || error.message);
    }
  }
);
```

This file contains a Redux action creator for creating a new branch. It uses `createAsyncThunk` from `@reduxjs/toolkit` to handle asynchronous operations and integrates with the `companyService` for making API calls. The function is documented with JSDoc comments, detailing its purpose, parameters, and return type.