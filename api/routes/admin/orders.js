const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
const { authenticateToken } = require('../auth/me');

const router = express.Router();

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_fallback';
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    req.user = user;
    next();
  });
}

// GET all orders
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection('orders').find({}).toArray();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT update order status
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const db = await connectDB();
    const result = await db.collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );
    if (result.modifiedCount === 1) {
      res.json({ success: true, message: 'Order status updated' });
    } else {
      res.status(404).json({ success: false, message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
