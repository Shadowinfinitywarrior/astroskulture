const express = require('express');
const { ObjectId } = require('mongodb');
const connectDB = require('../../db');
const authenticateToken = require('../../middleware/auth');

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
    res.json({ success: true, users, timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error occurred while fetching users at 01:42 AM IST, Thursday, October 16, 2025.' });
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
    if (result.modifiedCount === 0) {
      return res.status(400).json({ success: false, message: 'No changes made to user role.' });
    }

    res.json({ success: true, message: 'User role updated successfully at 01:42 AM IST, Thursday, October 16, 2025.' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ success: false, message: 'Server error occurred while updating user role at 01:42 AM IST, Thursday, October 16, 2025.' });
  }
});

module.exports = router;