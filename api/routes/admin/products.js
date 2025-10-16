const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
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

// GET all products
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const products = await db.collection('products').find({}).toArray();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST add product
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, category, price, images, description } = req.body;
    const db = await connectDB();
    const result = await db.collection('products').insertOne({ 
      name, 
      category, 
      price: parseFloat(price), 
      images, 
      description,
      createdAt: new Date()
    });
    res.json({ success: true, product: { ...req.body, _id: result.insertedId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT edit product
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, category, price, images, description } = req.body;
    const db = await connectDB();
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, category, price: parseFloat(price), images, description, updatedAt: new Date() } }
    );
    if (result.modifiedCount === 1) {
      res.json({ success: true, message: 'Product updated' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE product
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 1) {
      res.json({ success: true, message: 'Product deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
