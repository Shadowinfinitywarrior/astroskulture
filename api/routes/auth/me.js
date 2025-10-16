require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.get('/', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    try {
      const db = await connectDB();
      const userDoc = await db.collection('users').findOne({ _id: new ObjectId(user.id) });
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
});

module.exports = router;
