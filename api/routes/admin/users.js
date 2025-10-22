const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
// Import authenticateToken from me.js instead of middleware/auth
const { authenticateToken } = require('../auth/me');

const router = express.Router();

// GET all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const db = await connectDB();
    const users = await db.collection('users').find({}).toArray();
    
    // Remove passwords from response for security
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json({ 
      success: true, 
      users: usersWithoutPasswords, 
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred while fetching users.' 
    });
  }
});

// PUT update user role (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "user" or "admin".' });
    }

    const db = await connectDB();
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ 
      success: true, 
      message: 'User role updated successfully.' 
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error occurred while updating user role.' 
    });
  }
});

// DELETE user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if the authenticated user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admin role required.' });
    }

    const db = await connectDB();
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const result = await db.collection('users').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (result.deletedCount === 1) {
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
