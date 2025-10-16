const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { row } = req.query;
    const db = await connectDB();
    const configCollection = db.collection('config');
    const productsCollection = db.collection('products');

    if (row) {
      // Handle category.html request for specific row
      const config = await configCollection.findOne({ type: `home_${row}` });
      if (!config) {
        return res.json({ success: true, title: '', products: [] });
      }
      const products = await productsCollection.find({ _id: { $in: config.products.map(id => new ObjectId(id)) } }).toArray();
      res.json({ success: true, title: config.title, products });
    } else {
      // Handle index.html request for both rows
      const row1Config = await configCollection.findOne({ type: 'home_row1' }) || { title: 'Featured Oversized', products: [] };
      const row2Config = await configCollection.findOne({ type: 'home_row2' }) || { title: 'New Arrivals', products: [] };

      const row1Products = await productsCollection.find({ _id: { $in: row1Config.products.slice(0, 7).map(id => new ObjectId(id)) } }).toArray();
      const row2Products = await productsCollection.find({ _id: { $in: row2Config.products.slice(0, 7).map(id => new ObjectId(id)) } }).toArray();

      res.json({
        success: true,
        row1: { title: row1Config.title, products: row1Products },
        row2: { title: row2Config.title, products: row2Products }
      });
    }
  } catch (error) {
    console.error('Error in /api/home:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;