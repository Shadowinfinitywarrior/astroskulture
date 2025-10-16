const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    const db = await connectDB();
    const productsCollection = db.collection('products');
    let query = {};
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    let sortOption = {};
    if (sort) {
      if (sort === 'price-asc') sortOption = { price: 1 };
      else if (sort === 'price-desc') sortOption = { price: -1 };
      else if (sort === 'name-asc') sortOption = { name: 1 };
    }
    const products = await productsCollection.find(query).sort(sortOption).toArray();
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const product = await db.collection('products').findOne({ _id: new ObjectId(req.params.id) });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    console.error('Error in /api/products/:id:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const db = await connectDB();
    const products = await db.collection('products').find({ _id: { $in: ids.map(id => new ObjectId(id)) } }).toArray();
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error in /api/products POST:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;