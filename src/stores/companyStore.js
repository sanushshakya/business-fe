// src/stores/companyStore.js

import create from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for managing CompanyBranch and Product state with persistence.
 *
 * @module src/stores/companyStore.js
 */

const useCompanyStore = create(
  persist(
    (set) => ({
      companyBranch: null,
      product: null,

      /**
       * Update the company branch in the store.
       *
       * @param {Object} branch - The new company branch object.
       */
      setCompanyBranch: (branch) => set((state) => ({ ...state, companyBranch: branch })),

      /**
       * Update the product in the store.
       *
       * @param {Object} product - The new product object.
       */
      setProduct: (product) => set((state) => ({ ...state, product: product })),
    }),
    {
      name: 'company-store', // Name of the storage key
    }
  )
);

export default useCompanyStore;