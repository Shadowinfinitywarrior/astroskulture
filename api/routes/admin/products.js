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

// GET all products with enhanced filtering and sorting
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;
    const db = await connectDB();
    const productsCollection = db.collection('products');
    
    let query = {};
    
    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'details': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const products = await productsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();
    
    const totalProducts = await productsCollection.countDocuments(query);
    
    res.json({ 
      success: true, 
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / parseInt(limit)),
        totalProducts,
        hasNext: skip + products.length < totalProducts,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET single product by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
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
    
    res.json({ 
      success: true, 
      product 
    });
  } catch (error) {
    console.error('Error in GET /api/admin/products/:id:', error);
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

// POST add new product
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      price, 
      originalPrice,
      stock,
      images, 
      description,
      detailedDescription,
      details,
      careInstructions,
      color,
      fabric,
      printType,
      deliveryTime,
      featured = false
    } = req.body;
    
    // Validation
    if (!name || !category || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, category, and price are required' 
      });
    }
    
    if (price < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price cannot be negative' 
      });
    }
    
    if (stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock cannot be negative' 
      });
    }
    
    const db = await connectDB();
    
    // Parse arrays from text inputs
    const detailsArray = Array.isArray(details) ? details : 
                        (details ? details.split('\n').filter(line => line.trim() !== '') : []);
    
    const careInstructionsArray = Array.isArray(careInstructions) ? careInstructions : 
                                 (careInstructions ? careInstructions.split('\n').filter(line => line.trim() !== '') : []);
    
    const imagesArray = Array.isArray(images) ? images : 
                       (images && images.length > 0 ? images : []);
    
    const productData = {
      name: name.trim(),
      category: category.trim().toLowerCase(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock) || 0,
      images: imagesArray,
      description: description ? description.trim() : '',
      detailedDescription: detailedDescription ? detailedDescription.trim() : '',
      details: detailsArray,
      careInstructions: careInstructionsArray,
      color: color ? color.trim() : '',
      fabric: fabric ? fabric.trim() : '',
      printType: printType ? printType.trim() : '',
      deliveryTime: deliveryTime ? deliveryTime.trim() : '',
      featured: Boolean(featured),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('products').insertOne(productData);
    
    res.json({ 
      success: true, 
      product: { ...productData, _id: result.insertedId },
      message: 'Product added successfully'
    });
    
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT update product
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      category, 
      price, 
      originalPrice,
      stock,
      images, 
      description,
      detailedDescription,
      details,
      careInstructions,
      color,
      fabric,
      printType,
      deliveryTime,
      featured
    } = req.body;
    
    // Validation
    if (!name || !category || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, category, and price are required' 
      });
    }
    
    if (price < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Price cannot be negative' 
      });
    }
    
    if (stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock cannot be negative' 
      });
    }
    
    const db = await connectDB();
    
    // Parse arrays from text inputs
    const detailsArray = Array.isArray(details) ? details : 
                        (details ? details.split('\n').filter(line => line.trim() !== '') : []);
    
    const careInstructionsArray = Array.isArray(careInstructions) ? careInstructions : 
                                 (careInstructions ? careInstructions.split('\n').filter(line => line.trim() !== '') : []);
    
    const imagesArray = Array.isArray(images) ? images : 
                       (images && images.length > 0 ? images : []);
    
    const updateData = {
      name: name.trim(),
      category: category.trim().toLowerCase(),
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      stock: parseInt(stock) || 0,
      images: imagesArray,
      description: description ? description.trim() : '',
      detailedDescription: detailedDescription ? detailedDescription.trim() : '',
      details: detailsArray,
      careInstructions: careInstructionsArray,
      color: color ? color.trim() : '',
      fabric: fabric ? fabric.trim() : '',
      printType: printType ? printType.trim() : '',
      deliveryTime: deliveryTime ? deliveryTime.trim() : '',
      featured: Boolean(featured),
      updatedAt: new Date()
    };
    
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: { ...updateData, _id: new ObjectId(req.params.id) }
    });
    
  } catch (error) {
    console.error('Error in PUT /api/admin/products/:id:', error);
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

// DELETE product
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('products').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 1) {
      res.json({ 
        success: true, 
        message: 'Product deleted successfully' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
  } catch (error) {
    console.error('Error in DELETE /api/admin/products/:id:', error);
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

// PATCH update product stock
router.patch('/:id/stock', authenticateAdmin, async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Stock cannot be negative' 
      });
    }
    
    const db = await connectDB();
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          stock: parseInt(stock),
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Stock updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in PATCH /api/admin/products/:id/stock:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PATCH toggle product featured status
router.patch('/:id/featured', authenticateAdmin, async (req, res) => {
  try {
    const { featured } = req.body;
    
    const db = await connectDB();
    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          featured: Boolean(featured),
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Product ${featured ? 'added to' : 'removed from'} featured products` 
    });
    
  } catch (error) {
    console.error('Error in PATCH /api/admin/products/:id/featured:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
