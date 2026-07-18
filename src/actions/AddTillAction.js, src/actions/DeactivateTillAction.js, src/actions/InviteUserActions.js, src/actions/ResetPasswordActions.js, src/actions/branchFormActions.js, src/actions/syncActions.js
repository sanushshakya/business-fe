// src/actions/AddTillAction.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import TillService from '../services/TillService';

/**
 * Thunk action creator for adding a new till.
 * @param {Object} payload - The payload containing the till data to be added.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const addTill = createAsyncThunk(
  'tills/add',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await TillService.addTill(payload);
      return response.data;
    } catch (error) {
      console.error('Error adding till:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  },
);

// src/actions/DeactivateTillAction.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import TillService from '../services/TillService';

/**
 * Thunk action creator for deactivating a till.
 * @param {number} id - The ID of the till to deactivate.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const deactivateTill = createAsyncThunk(
  'tills/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await TillService.deactivateTill(id);
      return response.data;
    } catch (error) {
      console.error('Error deactivating till:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  },
);

// src/actions/InviteUserActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import UserService from '../services/UserService';

/**
 * Thunk action creator for inviting a new user.
 * @param {Object} payload - The payload containing the user data to be invited.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const inviteUser = createAsyncThunk(
  'users/invite',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await UserService.inviteUser(payload);
      return response.data;
    } catch (error) {
      console.error('Error inviting user:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  },
);

// src/actions/ResetPasswordActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '../services/AuthService';

/**
 * Thunk action creator for resetting a user's password.
 * @param {Object} payload - The payload containing the reset password data.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await AuthService.resetPassword(payload);
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  },
);

// src/actions/branchFormActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import BranchService from '../services/BranchService';

/**
 * Thunk action creator for creating a new branch.
 * @param {Object} payload - The payload containing the branch data to be created.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const createBranch = createAsyncThunk(
  'branches/create',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await BranchService.createBranch(payload);
      return response.data;
    } catch (error) {
      console.error('Error creating branch:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  },
);

// src/actions/syncActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import SyncService from '../services/SyncService';

/**
 * Thunk action creator for initiating a synchronization process.
 * @returns {Promise} - A promise that resolves with the response or rejects with an error.
 */
export const initiateSync = createAsyncThunk(
  'sync/initiate',
  async (_, { rejectWithValue }) => {
    try {
      const response = await SyncService.initiateSync();
      return response.data;
    } catch (error) {
      console.error('Error initiating sync:', error);
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  },
);