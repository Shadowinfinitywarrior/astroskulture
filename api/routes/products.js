const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../db');
const router = express.Router();

// GET /api/products - Get all products with filtering, sorting, and search
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, featured, limit, minDiscount } = req.query;
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
        { 'details': { $regex: search, $options: 'i' } },
        { 'brand': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Featured products filter
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Minimum discount filter
    if (minDiscount) {
      query.$expr = {
        $gte: [
          {
            $multiply: [
              { $divide: [{ $subtract: ['$originalPrice', '$price'] }, '$originalPrice'] },
              100
            ]
          },
          parseInt(minDiscount)
        ]
      };
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
        case 'discount':
          sortOption = { discountPercentage: -1 };
          break;
        case 'rating':
          sortOption = { rating: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }
    
    let productsQuery = productsCollection.find(query).sort(sortOption);
    
    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit))) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }
    
    const products = await productsQuery.toArray();
    
    // Format products for response with enhanced data
    const formattedProducts = products.map(product => {
      const discountPercentage = product.originalPrice && product.originalPrice > product.price ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
      
      return {
        _id: product._id,
        name: product.name,
        brand: product.brand || 'Astros Kulture',
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: discountPercentage,
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
        rating: product.rating || 4.0,
        reviewCount: product.reviewCount || 0,
        sizes: product.sizes || ['M', 'L', 'XL', 'XXL'],
        fit: product.fit || 'Regular',
        material: product.material || 'Cotton',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });
    
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
    
    const discountPercentage = product.originalPrice && product.originalPrice > product.price ? 
      Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    // Format product response with enhanced data
    const formattedProduct = {
      _id: product._id,
      name: product.name,
      brand: product.brand || 'Astros Kulture',
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercentage: discountPercentage,
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
      rating: product.rating || 4.0,
      reviewCount: product.reviewCount || 0,
      sizes: product.sizes || ['M', 'L', 'XL', 'XXL'],
      fit: product.fit || 'Regular',
      material: product.material || 'Cotton',
      tags: product.tags || [],
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
    
    // Format products for response with enhanced data
    const formattedProducts = products.map(product => {
      const discountPercentage = product.originalPrice && product.originalPrice > product.price ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
      
      return {
        _id: product._id,
        name: product.name,
        brand: product.brand || 'Astros Kulture',
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: discountPercentage,
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
        rating: product.rating || 4.0,
        reviewCount: product.reviewCount || 0,
        sizes: product.sizes || ['M', 'L', 'XL', 'XXL'],
        fit: product.fit || 'Regular',
        material: product.material || 'Cotton',
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });
    
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
    const { limit, sort } = req.query;
    
    const db = await connectDB();
    const productsCollection = db.collection('products');
    
    let query = { category: category.toLowerCase() };
    let sortOption = { createdAt: -1 };
    
    if (sort === 'discount') {
      sortOption = { discountPercentage: -1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    }
    
    let productsQuery = productsCollection.find(query).sort(sortOption);
    
    if (limit && !isNaN(parseInt(limit))) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }
    
    const products = await productsQuery.toArray();
    
    const formattedProducts = products.map(product => {
      const discountPercentage = product.originalPrice && product.originalPrice > product.price ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
      
      return {
        _id: product._id,
        name: product.name,
        brand: product.brand || 'Astros Kulture',
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: discountPercentage,
        stock: product.stock || 0,
        images: product.images || [],
        description: product.description,
        rating: product.rating || 4.0,
        reviewCount: product.reviewCount || 0,
        featured: product.featured || false
      };
    });
    
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
    
    const formattedProducts = featuredProducts.map(product => {
      const discountPercentage = product.originalPrice && product.originalPrice > product.price ? 
        Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
      
      return {
        _id: product._id,
        name: product.name,
        brand: product.brand || 'Astros Kulture',
        category: product.category,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercentage: discountPercentage,
        stock: product.stock || 0,
        images: product.images || [],
        description: product.description,
        rating: product.rating || 4.0,
        reviewCount: product.reviewCount || 0
      };
    });
    
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

// GET /api/products/search/suggestions - Get search suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }
    
    const db = await connectDB();
    const products = await db.collection('products')
      .find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      })
      .limit(5)
      .toArray();
    
    const suggestions = products.map(product => ({
      _id: product._id,
      name: product.name,
      brand: product.brand || 'Astros Kulture',
      price: product.price,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      category: product.category
    }));
    
    res.json({ success: true, suggestions });
    
  } catch (error) {
    console.error('Error in /api/products/search/suggestions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
