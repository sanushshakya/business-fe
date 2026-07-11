// src/components/BranchForm.jsx

import React, { useState } from 'react';

/**
 * BranchForm component to handle the form for adding a new branch.
 *
 * @returns {React.FC} - The BranchForm component
 */
const BranchForm = () => {
  // State to hold branch data
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');

  /**
   * Handle form submission.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - The form submission event.
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    // Logic to add branch
    console.log('Branch Name:', branchName);
    console.log('Address:', address);
    setBranchName('');
    setAddress('');
  };

  /**
   * Handle input change for branch name.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event.
   */
  const handleBranchNameChange = (event) => {
    setBranchName(event.target.value);
  };

  /**
   * Handle input change for address.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - The input change event.
   */
  const handleAddressChange = (event) => {
    setAddress(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="branchName">Branch Name:</label>
        <input
          type="text"
          id="branchName"
          value={branchName}
          onChange={handleBranchNameChange}
          required
        />
      </div>
      <div>
        <label htmlFor="address">Address:</label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={handleAddressChange}
          required
        />
      </div>
      <button type="submit">Add Branch</button>
    </form>
  );
};

export default BranchForm;