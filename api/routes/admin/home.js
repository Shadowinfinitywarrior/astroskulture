const express = require('express');
const jwt = require('jsonwebtoken');
const connectDB = require('../../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_fallback';

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
    if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    req.user = user;
    next();
  });
}

router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const row1 = await db.collection('config').findOne({ type: 'home_row1' });
    const row2 = await db.collection('config').findOne({ type: 'home_row2' });
    res.json({ success: true, row1, row2 });
  } catch (error) {
    console.error('Error in /api/admin/home GET:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { row, title, products } = req.body;
    if (!row || !title || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    if (products.length > 7) {
      return res.status(400).json({ success: false, message: 'Maximum 7 products per row' });
    }
    const db = await connectDB();
    await db.collection('config').updateOne(
      { type: `home_${row}` },
      { $set: { title, products } },
      { upsert: true }
    );
    res.json({ success: true, message: `Row ${row} updated` });
  } catch (error) {
    console.error('Error in /api/admin/home POST:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
