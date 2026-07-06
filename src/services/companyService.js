/**
 * @module src/services/companyService.js
 */

const axios = require('./utils/axios');

/**
 * Service class for handling operations related to Company model.
 */
class CompanyService {
  /**
   * Marks onboarding complete for a company.
   *
   * @param {string} companyId - The ID of the company to mark onboarding complete for.
   * @returns {Promise<void>} - A promise that resolves when the operation is successful.
   */
  static async markOnboardingComplete(companyId) {
    try {
      const response = await axios.patch(`/api/tenants/company/onboarding-complete/${companyId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to mark onboarding complete for company ${companyId}: ${error.message}`);
    }
  }
}

module.exports = CompanyService;