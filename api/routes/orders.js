const express = require('express');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectDB = require('../db');
const router = express.Router();

const JWT_SECRET = 'your_jwt_secret';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    req.user = user;
    next();
  });
}

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || typeof items !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const db = await connectDB();
    const products = await db.collection('products').find({ _id: { $in: Object.keys(items).map(id => new ObjectId(id)) } }).toArray();
    const total = products.reduce((sum, p) => sum + p.price * (items[p._id.toString()] || 0), 0);
    await db.collection('orders').insertOne({
      userId: new ObjectId(req.user.id),
      userEmail: req.user.email,
      items,
      total,
      createdAt: new Date()
    });
    res.json({ success: true, message: 'Order placed' });
  } catch (error) {
    console.error('Error in /api/orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection('orders').find({ userId: new ObjectId(req.user.id) }).toArray();
    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error in /api/orders GET:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;