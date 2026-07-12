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
   * @param {Date} data.lastSeenAt - Timestamp of when the till was last seen.
   */
  constructor(data) {
    this.id = data.id;
    this.branchId = data.branchId;
    this.isActive = data.isActive || true;
    this.lastSeenAt = data.lastSeenAt || new Date(); // Initialize to current time if not provided
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
   * Updates the last seen timestamp of the till.
   *
   * @param {Date} newTime - The new timestamp to set.
   * @returns {void}
   */
  updateLastSeenAt(newTime) {
    this.lastSeenAt = newTime || new Date(); // Update to current time if not provided
  }

  /**
   * Returns a string representation of the till.
   *
   * @returns {string} - The string representation of the till.
   */
  toString() {
    return `Till ${this.id} in branch ${this.branchId} is ${this.isActive ? 'active' : 'inactive'} and last seen at ${this.lastSeenAt}.`;
  }
}

export default Till;