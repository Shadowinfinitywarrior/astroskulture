const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connectDB = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_fallback';

router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const db = await connectDB();
    const users = db.collection('users');
    const user = await users.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ 
      id: user._id.toString(), 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id.toString(),
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
