const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../db');
const router = express.Router();

// GET /api/products - Get all products with filtering, sorting, and search
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, featured } = req.query;
    const db = await connectDB();
    const productsCollection = db.collection('products');
    
    let query = {};
    
    // Category filter
    if (category) query.category = category;
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'details': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Featured products filter
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Sort options
    let sortOption = { createdAt: -1 }; // Default sort by newest
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption = { price: 1 };
          break;
        case 'price-desc':
          sortOption = { price: -1 };
          break;
        case 'name-asc':
          sortOption = { name: 1 };
          break;
        case 'name-desc':
          sortOption = { name: -1 };
          break;
        case 'newest':
          sortOption = { createdAt: -1 };
          break;
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }
    
    const products = await productsCollection.find(query).sort(sortOption).toArray();
    
    // Format products for response
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock || 0,
      images: product.images || [],
      description: product.description,
      detailedDescription: product.detailedDescription,
      details: product.details || [],
      careInstructions: product.careInstructions || [],
      color: product.color,
      fabric: product.fabric,
      printType: product.printType,
      deliveryTime: product.deliveryTime,
      featured: product.featured || false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));
    
    res.json({ 
      success: true, 
      products: formattedProducts,
      total: formattedProducts.length
    });
    
  } catch (error) {
    console.error('Error in /api/products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const product = await db.collection('products').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    // Format product response
    const formattedProduct = {
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock || 0,
      images: product.images || [],
      description: product.description,
      detailedDescription: product.detailedDescription,
      details: product.details || [],
      careInstructions: product.careInstructions || [],
      color: product.color,
      fabric: product.fabric,
      printType: product.printType,
      deliveryTime: product.deliveryTime,
      featured: product.featured || false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
    
    res.json({ 
      success: true, 
      product: formattedProduct 
    });
    
  } catch (error) {
    console.error('Error in /api/products/:id:', error);
    if (error.name === 'BSONTypeError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST /api/products - Get multiple products by IDs
router.post('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid input. Expected array of product IDs.' 
      });
    }
    
    const db = await connectDB();
    const objectIds = ids.map(id => {
      try {
        return new ObjectId(id);
      } catch (error) {
        return null;
      }
    }).filter(id => id !== null);
    
    if (objectIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid product IDs provided' 
      });
    }
    
    const products = await db.collection('products')
      .find({ _id: { $in: objectIds } })
      .toArray();
    
    // Format products for response
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock || 0,
      images: product.images || [],
      description: product.description,
      detailedDescription: product.detailedDescription,
      details: product.details || [],
      careInstructions: product.careInstructions || [],
      color: product.color,
      fabric: product.fabric,
      printType: product.printType,
      deliveryTime: product.deliveryTime,
      featured: product.featured || false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));
    
    res.json({ 
      success: true, 
      products: formattedProducts 
    });
    
  } catch (error) {
    console.error('Error in /api/products POST:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit } = req.query;
    
    const db = await connectDB();
    const productsCollection = db.collection('products');
    
    let query = { category: category.toLowerCase() };
    let options = { sort: { createdAt: -1 } };
    
    if (limit && !isNaN(parseInt(limit))) {
      options.limit = parseInt(limit);
    }
    
    const products = await productsCollection.find(query, options).toArray();
    
    const formattedProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock || 0,
      images: product.images || [],
      description: product.description,
      featured: product.featured || false
    }));
    
    res.json({ 
      success: true, 
      products: formattedProducts,
      category: category,
      total: formattedProducts.length
    });
    
  } catch (error) {
    console.error('Error in /api/products/category/:category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// GET /api/products/featured/:limit - Get featured products
router.get('/featured/:limit?', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit) || 8;
    const db = await connectDB();
    
    const featuredProducts = await db.collection('products')
      .find({ featured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    const formattedProducts = featuredProducts.map(product => ({
      _id: product._id,
      name: product.name,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock || 0,
      images: product.images || [],
      description: product.description
    }));
    
    res.json({ 
      success: true, 
      products: formattedProducts 
    });
    
  } catch (error) {
    console.error('Error in /api/products/featured:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
