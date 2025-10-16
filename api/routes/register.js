const express = require('express');
const bcrypt = require('bcrypt');
const connectDB = require('../db');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const db = await connectDB();
    const users = db.collection('users');

    // Check if email exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await users.insertOne({ name, email, password: hashedPassword, role: 'user' });
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Error in /api/register:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;