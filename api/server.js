const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db');
const homeRoutes = require('./routes/home');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const meRoutes = require('./routes/auth/me');
const adminProductsRoutes = require('./routes/admin/products');
const adminHomeRoutes = require('./routes/admin/home');
const adminOrdersRoutes = require('./routes/admin/orders');
const wishlistRoutes = require('./routes/wishlist'); // New route
const reviewsRoutes = require('./routes/reviews');  // New route
const adminUsersRoutes = require('./routes/admin/users');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the project root
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html at the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// API routes
app.use('/api/home', homeRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/auth/me', meRoutes);
app.use('/api/admin/products', adminProductsRoutes);
app.use('/api/admin/home', adminHomeRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/wishlist', wishlistRoutes); // New route
app.use('/api/reviews', reviewsRoutes);   // New route
app.use('/api/admin/users', adminUsersRoutes);

// Start server
async function startServer() {
  try {
    await connectDB();
    app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
