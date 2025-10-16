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
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) return res.status(400).json({ success: false, message: 'Invalid input' });
    const db = await connectDB();
    const reviews = db.collection('reviews');
    await reviews.insertOne({
      userId: new ObjectId(req.user.id),
      productId: new ObjectId(productId),
      rating: parseInt(rating),
      comment,
      createdAt: new Date()
    });
    res.json({ success: true, message: 'Review added' });
  } catch (error) {
    console.error('Error in /api/reviews/add:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:productId', async (req, res) => {
  try {
    const db = await connectDB();
    const reviews = await db.collection('reviews').find({ productId: new ObjectId(req.params.productId) }).toArray();
    const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0;
    res.json({ success: true, reviews, avgRating });
  } catch (error) {
    console.error('Error in /api/reviews/:productId:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;