const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
const authenticateToken = require('../../middleware/auth');

const router = express.Router();

// GET all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection('orders').find({}).toArray();
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT update order status
router.put('/:id', authenticateToken, async (req, res) => {
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