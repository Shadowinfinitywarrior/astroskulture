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

// POST /api/orders - Create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
    
    if (!items || typeof items !== 'object' || Object.keys(items).length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid items data' });
    }
    
    if (!shippingAddress || !paymentMethod || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const db = await connectDB();
    
    // Get product details for the order
    const productIds = Object.keys(items).map(id => new ObjectId(id));
    const products = await db.collection('products')
      .find({ _id: { $in: productIds } })
      .toArray();
    
    // Calculate order total and prepare order items
    const orderItems = products.map(product => {
      const quantity = items[product._id.toString()] || 1;
      const itemTotal = product.price * quantity;
      const discount = product.originalPrice ? (product.originalPrice - product.price) * quantity : 0;
      
      return {
        productId: product._id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        quantity: quantity,
        itemTotal: itemTotal,
        discount: discount,
        image: product.images && product.images.length > 0 ? product.images[0] : null,
        size: items[`${product._id}_size`] || 'M' // Get selected size if available
      };
    });
    
    const orderTotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);
    const totalDiscount = orderItems.reduce((sum, item) => sum + item.discount, 0);
    
    // Calculate GST (18%)
    const gstAmount = orderTotal * 0.18;
    const finalTotal = orderTotal + gstAmount;
    
    // Create order
    const order = {
      userId: new ObjectId(req.user.id),
      userEmail: req.user.email,
      items: orderItems,
      orderTotal: orderTotal,
      discount: totalDiscount,
      gstAmount: gstAmount,
      finalTotal: finalTotal,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
      status: 'pending',
      orderNumber: 'AK' + Date.now().toString().slice(-8),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('orders').insertOne(order);
    
    // Update product stock
    for (const product of products) {
      const quantity = items[product._id.toString()] || 1;
      await db.collection('products').updateOne(
        { _id: product._id },
        { $inc: { stock: -quantity } }
      );
    }
    
    // Clear user's cart
    // Note: You might want to implement a separate cart collection
    // For now, we'll rely on localStorage clearing on the client side
    
    res.json({ 
      success: true, 
      message: 'Order placed successfully',
      orderId: result.insertedId,
      orderNumber: order.orderNumber
    });
    
  } catch (error) {
    console.error('Error in /api/orders:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/orders - Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const orders = await db.collection('orders')
      .find({ userId: new ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Format orders for response
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      orderTotal: order.orderTotal,
      discount: order.discount,
      gstAmount: order.gstAmount,
      finalTotal: order.finalTotal,
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));
    
    res.json({ 
      success: true, 
      orders: formattedOrders,
      total: formattedOrders.length
    });
    
  } catch (error) {
    console.error('Error in /api/orders GET:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/orders/:id - Get single order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const order = await db.collection('orders').findOne({ 
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.id)
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      orderTotal: order.orderTotal,
      discount: order.discount,
      gstAmount: order.gstAmount,
      finalTotal: order.finalTotal,
      status: order.status,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
    
    res.json({ 
      success: true, 
      order: formattedOrder 
    });
    
  } catch (error) {
    console.error('Error in /api/orders/:id:', error);
    if (error.name === 'BSONTypeError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid order ID' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const db = await connectDB();
    const order = await db.collection('orders').findOne({ 
      _id: new ObjectId(req.params.id),
      userId: new ObjectId(req.user.id)
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }
    
    // Check if order can be cancelled (only pending or confirmed orders)
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order cannot be cancelled at this stage' 
      });
    }
    
    // Update order status
    await db.collection('orders').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        } 
      }
    );
    
    // Restore product stock
    for (const item of order.items) {
      await db.collection('products').updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Order cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Error in /api/orders/:id/cancel:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
