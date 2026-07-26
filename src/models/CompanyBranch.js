/**
 * CompanyBranch model to represent a branch of a company with a name and address.
 *
 * @class CompanyBranch
 */
export default class CompanyBranch {
  /**
   * Creates an instance of CompanyBranch.
   *
   * @param {string} name - The name of the company branch. Must be between 3 and 100 characters long.
   * @param {string} address - The address of the company branch. Must not be empty.
   */
  constructor(name, address) {
    this.name = name;
    this.address = address;
  }

  /**
   * Get the name of the company branch.
   *
   * @returns {string} - The name of the company branch.
   */
  getName() {
    return this.name;
  }

  /**
   * Set the name of the company branch.
   *
   * @param {string} name - The new name for the company branch. Must be between 3 and 100 characters long.
   */
  setName(name) {
    if (typeof name !== 'string' || name.length < 3 || name.length > 100) {
      throw new Error('Name must be a string between 3 and 100 characters long.');
    }
    this.name = name;
  }

  /**
   * Get the address of the company branch.
   *
   * @returns {string} - The address of the company branch.
   */
  getAddress() {
    return this.address;
  }

  /**
   * Set the address of the company branch.
   *
   * @param {string} address - The new address for the company branch. Must not be empty.
   */
  setAddress(address) {
    if (typeof address !== 'string' || address.trim().length === 0) {
      throw new Error('Address must not be empty.');
    }
    this.address = address;
  }
}