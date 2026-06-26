/**
 * AlertsDemand model to store alerts demand data.
 * @module src/models/AlertsDemand
 */

export default class AlertsDemand {
  /**
   * Creates an instance of AlertsDemand.
   * @param {number} id - The unique identifier for the alert demand.
   * @param {string} title - The title of the alert demand.
   * @param {string} description - The description of the alert demand.
   * @param {boolean} isDismissed - Indicates whether the alert demand has been dismissed.
   */
  constructor(id, title, description, isDismissed) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.isDismissed = isDismissed || false;
  }

  /**
   * Marks the alert demand as dismissed.
   */
  dismiss() {
    this.isDismissed = true;
  }

  /**
   * Resets the dismissal status of the alert demand.
   */
  resetDismissal() {
    this.isDismissed = false;
  }
}