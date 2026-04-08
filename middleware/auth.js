const jwt = require('jsonwebtoken');

// This middleware validates a JSON Web Token passed in the Authorization
// header.  On success the decoded payload is attached to req.user; on
// failure the request is rejected with status 401.
module.exports = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
