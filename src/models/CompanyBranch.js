/**
 * CompanyBranch model to represent a branch of a company with a name and address.
 *
 * @class CompanyBranch
 */
export default class CompanyBranch {
  /**
   * Creates an instance of CompanyBranch.
   *
   * @param {string} name - The name of the company branch.
   * @param {string} address - The address of the company branch.
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
   * @param {string} name - The new name for the company branch.
   */
  setName(name) {
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
   * @param {string} address - The new address for the company branch.
   */
  setAddress(address) {
    this.address = address;
  }
}