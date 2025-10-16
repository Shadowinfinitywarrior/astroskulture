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

router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'Invalid input' });
    const db = await connectDB();
    const wishlist = db.collection('wishlist');
    const existing = await wishlist.findOne({ userId: new ObjectId(req.user.id), productId: new ObjectId(productId) });
    if (existing) return res.json({ success: true, message: 'Already in wishlist' });
    await wishlist.insertOne({ userId: new ObjectId(req.user.id), productId: new ObjectId(productId), createdAt: new Date() });
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error in /api/wishlist/add:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const wishlist = await db.collection('wishlist').find({ userId: new ObjectId(req.user.id) }).toArray();
    const productIds = wishlist.map(w => w.productId);
    const products = await db.collection('products').find({ _id: { $in: productIds } }).toArray();
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error in /api/wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;