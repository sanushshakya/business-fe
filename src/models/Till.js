// src/models/Till.js

/**
 * Till model to represent a till entity with relevant details and actions.
 */
class Till {
  /**
   * Creates a new instance of the Till class.
   *
   * @param {Object} data - The data for initializing the till.
   * @param {string} data.id - Unique identifier for the till.
   * @param {string} data.branchId - Identifier for the branch this till belongs to.
   * @param {boolean} data.isActive - Flag indicating if the till is active.
   */
  constructor(data) {
    this.id = data.id;
    this.branchId = data.branchId;
    this.isActive = data.isActive || true;
  }

  /**
   * Activates the till.
   *
   * @returns {void}
   */
  activate() {
    if (!this.isActive) {
      this.isActive = true;
    }
  }

  /**
   * Deactivates the till.
   *
   * @returns {void}
   */
  deactivate() {
    if (this.isActive) {
      this.isActive = false;
    }
  }

  /**
   * Returns a string representation of the till.
   *
   * @returns {string} - The string representation of the till.
   */
  toString() {
    return `Till ${this.id} in branch ${this.branchId} is ${this.isActive ? 'active' : 'inactive'}.`;
  }
}

export default Till;