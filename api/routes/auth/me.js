require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware function - make sure this is defined
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Route handler
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const userDoc = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: 'User data retrieved successfully',
      data: { name: userDoc.name, email: userDoc.email, role: userDoc.role }
    });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export both the router AND the middleware function
module.exports = router;
module.exports.authenticateToken = authenticateToken;
