/**
 * AlertsDemand model to store alerts demand data.
 * @module src/models/AlertsDemand
 */

import { nanoid } from 'nanoid'; // Importing a unique ID generator

export default class AlertsDemand {
  /**
   * Creates an instance of AlertsDemand.
   * @param {string} id - The unique identifier for the alert demand (using nanoid if not provided).
   * @param {string} title - The title of the alert demand.
   * @param {string} description - The description of the alert demand.
   * @param {boolean} isDismissed - Indicates whether the alert demand has been dismissed.
   */
  constructor(id = nanoid(), title, description, isDismissed = false) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.isDismissed = isDismissed;
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