const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware to validate JWT token and set is_verified attribute if valid.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const TokenVerificationMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    const error = new Error('No token provided');
    error.status = 403;
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      const error = new Error('Failed to authenticate token');
      error.status = 401;
      return res.status(401).json({ message: 'Failed to authenticate token' });
    }

    // Assuming the user model has an attribute is_verified
    req.user = { ...req.user, is_verified: true };
    next();
  });
};

module.exports = TokenVerificationMiddleware;