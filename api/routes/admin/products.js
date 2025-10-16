const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
const authenticateToken = require('../../middleware/auth'); // Assume middleware for admin check

const router = express.Router();

// GET all products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const products = await db.collection('products').find({}).toArray();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST add product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, images, description } = req.body;
    const db = await connectDB();
    const result = await db.collection('products').insertOne({ name, category, price: parseFloat(price), images, description });
    res.json({ success: true, product: result.ops[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT edit product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, category, price, images, description } = req.body;
    const db = await connectDB();
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { name, category, price: parseFloat(price), images, description } }
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
router.delete('/:id', authenticateToken, async (req, res) => {
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