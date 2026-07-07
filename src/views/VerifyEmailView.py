// src/views/VerifyEmailView.py

import jwt from 'jsonwebtoken';
import { User } from '../models/User'; // Assuming User model is defined elsewhere

/**
 * View for verifying email by validating the token and updating user's is_verified field.
 *
 * @class VerifyEmailView
 */
class VerifyEmailView {
  /**
   * Handle POST request to verify email using a token.
   *
   * @param {Object} req - Express request object.
   * @param {Object} res - Express response object.
   * @returns {Promise<Object>} - Promise resolving with a JSON response.
   */
  async handlePost(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Assuming decoded contains user id or email
      const userId = decoded.userId; // Adjust based on your token structure

      // Find the user by ID and update is_verified to true
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      user.is_verified = true;
      await user.save();

      return res.status(200).json({ message: 'Email verified successfully', isVerified: user.is_verified });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token has expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
}

export default new VerifyEmailView();