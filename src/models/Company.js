/**
 * Company model to represent a company with various details and an onboarding status flag.
 * @module src/models/Company.js
 */

const mongoose = require('mongoose');

// Define the schema for the Company model
const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  onboardingComplete: {
    type: Boolean,
    default: false, // Default value for new companies
  },
});

// Create the Company model from the schema
const Company = mongoose.model('Company', companySchema);

module.exports = Company;