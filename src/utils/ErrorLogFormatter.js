// src/utils/ErrorLogFormatter.js

/**
 * @module src/utils/ErrorLogFormatter
 * Custom formatter for error logs with a structured format.
 */

class ErrorLogFormatter {
  /**
   * Formats the given error object into a structured log message.
   *
   * @param {Error} error - The error object to format.
   * @return {string} - The formatted error log message.
   */
  static format(error) {
    const timestamp = new Date().toISOString();
    const name = error.name || 'Unknown Error';
    const message = error.message || 'No error message provided';
    const stack = error.stack || 'No stack trace available';

    return `[${timestamp}] [ERROR] ${name}: ${message}\n${stack}`;
  }
}

export default ErrorLogFormatter;